#!/usr/bin/env node

// Configuration Validator for AI Cold Calling System
// Run with: node scripts/validate-config.js

const fs = require('fs');
const path = require('path');
require('dotenv').config();

class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  validate() {
    console.log('🔍 Validating AI Cold Calling System Configuration...\n');

    this.validateEnvironmentFile();
    this.validateRequiredVariables();
    this.validateFileStructure();
    this.validateGoogleSheetsTemplate();
    this.validateConversationPrompts();
    this.validateEmailTemplates();
    this.validateN8nWorkflow();

    this.printResults();
    
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }

  validateEnvironmentFile() {
    const envPath = path.join(__dirname, '../.env');
    
    if (!fs.existsSync(envPath)) {
      this.errors.push('❌ .env file not found. Run "npm run setup" or copy .env.example to .env');
      return;
    }
    
    this.success.push('✅ .env file exists');
  }

  validateRequiredVariables() {
    const requiredVars = [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN', 
      'TWILIO_PHONE_NUMBER',
      'OPENAI_API_KEY',
      'ELEVENLABS_API_KEY',
      'DEEPGRAM_API_KEY',
      'GOOGLE_SHEETS_ID',
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
      'DEALERSHIP_NAME',
      'BOT_NAME',
      'DOMAIN',
      'WEBHOOK_BASE_URL'
    ];

    const missing = [];
    const present = [];

    requiredVars.forEach(varName => {
      if (!process.env[varName] || process.env[varName].trim() === '') {
        missing.push(varName);
      } else {
        present.push(varName);
      }
    });

    if (missing.length > 0) {
      this.errors.push(`❌ Missing required environment variables: ${missing.join(', ')}`);
    } else {
      this.success.push(`✅ All ${requiredVars.length} required environment variables are set`);
    }

    // Validate specific formats
    this.validatePhoneNumber();
    this.validateUrls();
    this.validateEmailConfig();
  }

  validatePhoneNumber() {
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (phoneNumber && !phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      this.warnings.push('⚠️  Phone number should be in E.164 format (e.g., +1234567890)');
    }
  }

  validateUrls() {
    const webhookUrl = process.env.WEBHOOK_BASE_URL;
    if (webhookUrl && !webhookUrl.startsWith('https://')) {
      this.warnings.push('⚠️  WEBHOOK_BASE_URL should use HTTPS for production');
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl && !n8nUrl.startsWith('https://')) {
      this.warnings.push('⚠️  N8N_WEBHOOK_URL should use HTTPS');
    }
  }

  validateEmailConfig() {
    const emailVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missingEmail = emailVars.filter(varName => !process.env[varName]);
    
    if (missingEmail.length > 0) {
      this.warnings.push(`⚠️  Email configuration incomplete. Missing: ${missingEmail.join(', ')}`);
    } else {
      this.success.push('✅ Email configuration complete');
    }
  }

  validateFileStructure() {
    const requiredFiles = [
      'webhooks/twilio-voice-handler.js',
      'webhooks/voice-services.js',
      'webhooks/package.json',
      'config/conversation-prompts.json',
      'config/email-templates.json',
      'config/google-sheets-template.csv',
      'n8n-workflows/ai-cold-calling-workflow.json'
    ];

    const requiredDirs = [
      'webhooks',
      'config',
      'scripts',
      'docs',
      'tests',
      'n8n-workflows'
    ];

    // Check directories
    requiredDirs.forEach(dir => {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        this.errors.push(`❌ Missing directory: ${dir}`);
      }
    });

    // Check files
    const missingFiles = [];
    const presentFiles = [];

    requiredFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      } else {
        presentFiles.push(file);
      }
    });

    if (missingFiles.length > 0) {
      this.errors.push(`❌ Missing required files: ${missingFiles.join(', ')}`);
    } else {
      this.success.push(`✅ All ${requiredFiles.length} required files present`);
    }
  }

  validateGoogleSheetsTemplate() {
    const templatePath = path.join(__dirname, '../config/google-sheets-template.csv');
    
    if (!fs.existsSync(templatePath)) {
      this.errors.push('❌ Google Sheets template not found');
      return;
    }

    try {
      const content = fs.readFileSync(templatePath, 'utf8');
      const headers = content.split('\n')[0].split(',');
      
      const requiredHeaders = [
        'customer_name',
        'phone_number',
        'car_model',
        'call_status',
        'call_attempts',
        'still_interested',
        'wants_appointment',
        'interested_similar',
        'email_address'
      ];

      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      
      if (missingHeaders.length > 0) {
        this.errors.push(`❌ Google Sheets template missing headers: ${missingHeaders.join(', ')}`);
      } else {
        this.success.push('✅ Google Sheets template has all required headers');
      }
    } catch (error) {
      this.errors.push(`❌ Error reading Google Sheets template: ${error.message}`);
    }
  }

  validateConversationPrompts() {
    const promptsPath = path.join(__dirname, '../config/conversation-prompts.json');
    
    if (!fs.existsSync(promptsPath)) {
      this.errors.push('❌ Conversation prompts file not found');
      return;
    }

    try {
      const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
      
      const requiredSections = ['system_prompt', 'conversation_flow', 'response_classification'];
      const missingSections = requiredSections.filter(section => !prompts[section]);
      
      if (missingSections.length > 0) {
        this.errors.push(`❌ Conversation prompts missing sections: ${missingSections.join(', ')}`);
      }

      const requiredStates = ['greeting', 'confirm_interest', 'arrange_appointment', 'offer_similar', 'collect_email'];
      const missingStates = requiredStates.filter(state => !prompts.conversation_flow?.[state]);
      
      if (missingStates.length > 0) {
        this.errors.push(`❌ Conversation flow missing states: ${missingStates.join(', ')}`);
      }

      if (missingSections.length === 0 && missingStates.length === 0) {
        this.success.push('✅ Conversation prompts configuration is valid');
      }
    } catch (error) {
      this.errors.push(`❌ Error parsing conversation prompts: ${error.message}`);
    }
  }

  validateEmailTemplates() {
    const templatesPath = path.join(__dirname, '../config/email-templates.json');
    
    if (!fs.existsSync(templatesPath)) {
      this.errors.push('❌ Email templates file not found');
      return;
    }

    try {
      const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
      
      if (!templates.similar_cars_email) {
        this.errors.push('❌ Email templates missing similar_cars_email template');
      } else {
        this.success.push('✅ Email templates configuration is valid');
      }
    } catch (error) {
      this.errors.push(`❌ Error parsing email templates: ${error.message}`);
    }
  }

  validateN8nWorkflow() {
    const workflowPath = path.join(__dirname, '../n8n-workflows/ai-cold-calling-workflow.json');
    
    if (!fs.existsSync(workflowPath)) {
      this.errors.push('❌ n8n workflow file not found');
      return;
    }

    try {
      const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
      
      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        this.errors.push('❌ n8n workflow has invalid structure');
      } else if (workflow.nodes.length === 0) {
        this.errors.push('❌ n8n workflow has no nodes');
      } else {
        this.success.push(`✅ n8n workflow is valid with ${workflow.nodes.length} nodes`);
      }
    } catch (error) {
      this.errors.push(`❌ Error parsing n8n workflow: ${error.message}`);
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 CONFIGURATION VALIDATION RESULTS');
    console.log('='.repeat(60));

    if (this.success.length > 0) {
      console.log('\n✅ PASSED CHECKS:');
      this.success.forEach(msg => console.log(`   ${msg}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(msg => console.log(`   ${msg}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(msg => console.log(`   ${msg}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 SUMMARY: ${this.success.length} passed, ${this.warnings.length} warnings, ${this.errors.length} errors`);
    console.log('='.repeat(60));

    if (this.errors.length === 0) {
      console.log('\n🎉 Configuration validation passed! Your system is ready for deployment.');
      console.log('\nNext steps:');
      console.log('1. Run "npm test" to test integrations');
      console.log('2. Deploy webhook server to Render.com');
      console.log('3. Import n8n workflow');
      console.log('4. Configure Twilio webhooks');
    } else {
      console.log('\n⚠️  Please fix the errors above before proceeding with deployment.');
    }
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  const validator = new ConfigValidator();
  validator.validate();
}

module.exports = ConfigValidator;
