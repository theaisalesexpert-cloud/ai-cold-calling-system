const express = require('express');
const { sheetsLogger } = require('../utils/logger');
const { catchAsync, AppError } = require('../utils/errorHandler');
const googleSheetsService = require('../services/googleSheetsService');

const router = express.Router();

/**
 * Get all customer data
 */
router.get('/customers', catchAsync(async (req, res) => {
  const customers = await googleSheetsService.getCustomerData();

  res.json({
    success: true,
    data: {
      customers,
      count: customers.length
    }
  });
}));

/**
 * Get customers ready for calling
 */
router.get('/customers/ready', catchAsync(async (req, res) => {
  const customers = await googleSheetsService.getCustomersForCalling();

  res.json({
    success: true,
    data: {
      customers,
      count: customers.length
    }
  });
}));

/**
 * Get specific customer by ID
 */
router.get('/customers/:customerId', catchAsync(async (req, res) => {
  const { customerId } = req.params;
  
  const customers = await googleSheetsService.getCustomerData();
  const customer = customers.find(c => c.id === customerId || c.customerId === customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  res.json({
    success: true,
    data: { customer }
  });
}));

/**
 * Add new customer
 */
router.post('/customers', catchAsync(async (req, res) => {
  const customerData = req.body;

  // Validate required fields
  if (!customerData.name || !customerData.phone) {
    throw new AppError('Name and phone are required fields', 400);
  }

  const result = await googleSheetsService.addCustomer(customerData);

  res.status(201).json({
    success: true,
    message: 'Customer added successfully',
    data: result
  });
}));

/**
 * Update customer record
 */
router.put('/customers/:customerId', catchAsync(async (req, res) => {
  const { customerId } = req.params;
  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    throw new AppError('Update data is required', 400);
  }

  const result = await googleSheetsService.updateCustomerRecord(customerId, updateData);

  res.json({
    success: true,
    message: 'Customer record updated successfully',
    data: result
  });
}));

/**
 * Get call statistics
 */
router.get('/statistics', catchAsync(async (req, res) => {
  const stats = await googleSheetsService.getCallStatistics();

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * Validate sheet structure
 */
router.get('/validate', catchAsync(async (req, res) => {
  const validation = await googleSheetsService.validateSheetStructure();

  res.json({
    success: true,
    data: validation
  });
}));

/**
 * Bulk update customers
 */
router.put('/customers/bulk', catchAsync(async (req, res) => {
  const { updates } = req.body;

  if (!updates || !Array.isArray(updates)) {
    throw new AppError('Updates array is required', 400);
  }

  const results = [];

  for (const update of updates) {
    try {
      if (!update.customerId || !update.data) {
        results.push({
          customerId: update.customerId || 'unknown',
          success: false,
          error: 'customerId and data are required'
        });
        continue;
      }

      const result = await googleSheetsService.updateCustomerRecord(
        update.customerId,
        update.data
      );

      results.push({
        customerId: update.customerId,
        success: true,
        updatedFields: result.updatedFields
      });

    } catch (error) {
      sheetsLogger.error('Bulk update failed for customer', {
        customerId: update.customerId,
        error: error.message
      });

      results.push({
        customerId: update.customerId,
        success: false,
        error: error.message
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  res.json({
    success: true,
    message: `Bulk update completed. ${successCount} successful, ${failureCount} failed.`,
    data: {
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    }
  });
}));

/**
 * Search customers
 */
router.get('/customers/search/:query', catchAsync(async (req, res) => {
  const { query } = req.params;
  const { field = 'all' } = req.query;

  const customers = await googleSheetsService.getCustomerData();
  const lowerQuery = query.toLowerCase();

  let filteredCustomers;

  if (field === 'all') {
    filteredCustomers = customers.filter(customer => 
      Object.values(customer).some(value => 
        value && value.toString().toLowerCase().includes(lowerQuery)
      )
    );
  } else {
    filteredCustomers = customers.filter(customer => 
      customer[field] && customer[field].toString().toLowerCase().includes(lowerQuery)
    );
  }

  res.json({
    success: true,
    data: {
      customers: filteredCustomers,
      count: filteredCustomers.length,
      query,
      field
    }
  });
}));

/**
 * Get customers by status
 */
router.get('/customers/status/:status', catchAsync(async (req, res) => {
  const { status } = req.params;
  
  const customers = await googleSheetsService.getCustomerData();
  const filteredCustomers = customers.filter(customer => 
    customer.status && customer.status.toLowerCase() === status.toLowerCase()
  );

  res.json({
    success: true,
    data: {
      customers: filteredCustomers,
      count: filteredCustomers.length,
      status
    }
  });
}));

/**
 * Get customers called today
 */
router.get('/customers/called-today', catchAsync(async (req, res) => {
  const customers = await googleSheetsService.getCustomerData();
  const today = new Date().toISOString().split('T')[0];
  
  const calledToday = customers.filter(customer => 
    customer.lastCallDate === today
  );

  res.json({
    success: true,
    data: {
      customers: calledToday,
      count: calledToday.length,
      date: today
    }
  });
}));

/**
 * Export customers data
 */
router.get('/export', catchAsync(async (req, res) => {
  const { format = 'json' } = req.query;
  const customers = await googleSheetsService.getCustomerData();

  if (format === 'csv') {
    // Convert to CSV
    const headers = Object.keys(customers[0] || {});
    const csvContent = [
      headers.join(','),
      ...customers.map(customer => 
        headers.map(header => 
          `"${(customer[header] || '').toString().replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
    res.send(csvContent);
  } else {
    res.json({
      success: true,
      data: {
        customers,
        count: customers.length,
        exportedAt: new Date().toISOString()
      }
    });
  }
}));

/**
 * Test Google Sheets connection
 */
router.get('/test', catchAsync(async (req, res) => {
  try {
    const validation = await googleSheetsService.validateSheetStructure();
    const customers = await googleSheetsService.getCustomerData();

    res.json({
      success: true,
      message: 'Google Sheets connection successful',
      data: {
        sheetValidation: validation,
        customerCount: customers.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    throw new AppError(`Google Sheets connection failed: ${error.message}`, 500);
  }
}));

module.exports = router;
