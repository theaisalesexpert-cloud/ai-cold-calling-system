const { google } = require('googleapis');
const { sheetsLogger } = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');

class GoogleSheetsService {
  constructor() {
    this.sheetsId = process.env.GOOGLE_SHEETS_ID;
    this.auth = null;
    this.sheets = null;
    this.initializeAuth();
  }

  /**
   * Initialize Google Sheets authentication
   */
  async initializeAuth() {
    try {
      const credentials = {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)}`
      };

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      sheetsLogger.info('Google Sheets authentication initialized');
    } catch (error) {
      sheetsLogger.error('Failed to initialize Google Sheets auth', { error: error.message });
      throw new AppError('Failed to initialize Google Sheets authentication', 500);
    }
  }

  /**
   * Get all customer data from the sheet
   */
  async getCustomerData() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetsId,
        range: 'Customers!A:J', // Adjust range based on your sheet structure
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        sheetsLogger.warn('No customer data found in sheet');
        return [];
      }

      // Assuming first row is headers
      const headers = rows[0];
      const customers = rows.slice(1).map((row, index) => {
        const customer = {};
        headers.forEach((header, i) => {
          customer[this.normalizeHeader(header)] = row[i] || '';
        });
        customer.rowIndex = index + 2; // +2 because of 0-based index and header row
        return customer;
      });

      sheetsLogger.info('Customer data retrieved', { count: customers.length });
      return customers;
    } catch (error) {
      sheetsLogger.error('Failed to get customer data', { error: error.message });
      throw new AppError('Failed to retrieve customer data from Google Sheets', 500);
    }
  }

  /**
   * Get customers ready for calling (not called today, interested, etc.)
   */
  async getCustomersForCalling() {
    try {
      const allCustomers = await this.getCustomerData();
      const today = new Date().toISOString().split('T')[0];

      const customersForCalling = allCustomers.filter(customer => {
        // Filter logic: not called today, has phone number, status is not 'completed' or 'not_interested'
        const lastCallDate = customer.lastCallDate;
        const status = customer.status?.toLowerCase();
        const phone = customer.phone;

        return phone && 
               phone.trim() !== '' &&
               lastCallDate !== today &&
               !['completed', 'not_interested', 'do_not_call'].includes(status);
      });

      sheetsLogger.info('Customers filtered for calling', { 
        total: allCustomers.length,
        forCalling: customersForCalling.length 
      });

      return customersForCalling;
    } catch (error) {
      sheetsLogger.error('Failed to get customers for calling', { error: error.message });
      throw error;
    }
  }

  /**
   * Update customer record after call
   */
  async updateCustomerRecord(customerId, updateData) {
    try {
      // Find customer row
      const customers = await this.getCustomerData();
      const customer = customers.find(c => c.id === customerId || c.customerId === customerId);
      
      if (!customer) {
        throw new AppError('Customer not found', 404);
      }

      const rowIndex = customer.rowIndex;
      const updates = [];

      // Map update data to column letters (adjust based on your sheet structure)
      const columnMap = {
        status: 'F',           // Column F for status
        lastCallDate: 'G',     // Column G for last call date
        callResult: 'H',       // Column H for call result
        appointmentDate: 'I',  // Column I for appointment date
        email: 'J',            // Column J for email
        notes: 'K',            // Column K for notes
        callDuration: 'L',     // Column L for call duration
        sentiment: 'M'         // Column M for sentiment
      };

      // Prepare batch update
      Object.keys(updateData).forEach(key => {
        if (columnMap[key]) {
          updates.push({
            range: `Customers!${columnMap[key]}${rowIndex}`,
            values: [[updateData[key]]]
          });
        }
      });

      if (updates.length === 0) {
        sheetsLogger.warn('No valid updates provided', { customerId, updateData });
        return;
      }

      // Perform batch update
      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.sheetsId,
        resource: {
          valueInputOption: 'RAW',
          data: updates
        }
      });

      sheetsLogger.info('Customer record updated', { 
        customerId, 
        rowIndex, 
        updatedFields: Object.keys(updateData) 
      });

      return { success: true, updatedFields: Object.keys(updateData) };
    } catch (error) {
      sheetsLogger.error('Failed to update customer record', { 
        error: error.message, 
        customerId 
      });
      throw new AppError('Failed to update customer record', 500);
    }
  }

  /**
   * Add new customer to the sheet
   */
  async addCustomer(customerData) {
    try {
      const values = [
        [
          customerData.id || this.generateCustomerId(),
          customerData.name || '',
          customerData.phone || '',
          customerData.email || '',
          customerData.carModel || '',
          customerData.status || 'new',
          customerData.enquiryDate || new Date().toISOString().split('T')[0],
          '', // lastCallDate
          '', // callResult
          '', // appointmentDate
          customerData.notes || ''
        ]
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.sheetsId,
        range: 'Customers!A:K',
        valueInputOption: 'RAW',
        resource: { values }
      });

      sheetsLogger.info('New customer added', { 
        customerId: customerData.id,
        name: customerData.name 
      });

      return { success: true, customerId: customerData.id };
    } catch (error) {
      sheetsLogger.error('Failed to add customer', { error: error.message });
      throw new AppError('Failed to add customer to Google Sheets', 500);
    }
  }

  /**
   * Get call statistics
   */
  async getCallStatistics() {
    try {
      const customers = await this.getCustomerData();
      const today = new Date().toISOString().split('T')[0];

      const stats = {
        total: customers.length,
        calledToday: customers.filter(c => c.lastCallDate === today).length,
        interested: customers.filter(c => c.status === 'interested').length,
        appointments: customers.filter(c => c.appointmentDate && c.appointmentDate !== '').length,
        notInterested: customers.filter(c => c.status === 'not_interested').length,
        pending: customers.filter(c => !c.status || c.status === 'new').length
      };

      sheetsLogger.info('Call statistics retrieved', stats);
      return stats;
    } catch (error) {
      sheetsLogger.error('Failed to get call statistics', { error: error.message });
      throw error;
    }
  }

  /**
   * Normalize header names for consistent property access
   */
  normalizeHeader(header) {
    return header
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Generate unique customer ID
   */
  generateCustomerId() {
    return 'CUST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  /**
   * Validate sheet structure
   */
  async validateSheetStructure() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetsId,
        range: 'Customers!A1:M1',
      });

      const headers = response.data.values?.[0] || [];
      const expectedHeaders = [
        'ID', 'Name', 'Phone', 'Email', 'Car Model', 
        'Status', 'Enquiry Date', 'Last Call Date', 
        'Call Result', 'Appointment Date', 'Notes'
      ];

      const missingHeaders = expectedHeaders.filter(header => 
        !headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );

      if (missingHeaders.length > 0) {
        sheetsLogger.warn('Missing headers in sheet', { missingHeaders });
        return { valid: false, missingHeaders };
      }

      sheetsLogger.info('Sheet structure validated successfully');
      return { valid: true };
    } catch (error) {
      sheetsLogger.error('Failed to validate sheet structure', { error: error.message });
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
