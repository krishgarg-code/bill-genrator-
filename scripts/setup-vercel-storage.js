#!/usr/bin/env node

/**
 * Vercel Storage Setup Script
 * Automatically configures KV and Blob storage for the Order Management System
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up Vercel Storage for Order Management System...');
console.log('=' .repeat(60));

// Check if Vercel CLI is installed
function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI is installed');
    return true;
  } catch (error) {
    console.log('❌ Vercel CLI not found. Installing...');
    try {
      execSync('npm install -g vercel', { stdio: 'inherit' });
      console.log('✅ Vercel CLI installed successfully');
      return true;
    } catch (installError) {
      console.error('❌ Failed to install Vercel CLI:', installError.message);
      return false;
    }
  }
}

// Check if user is logged in to Vercel
function checkVercelAuth() {
  try {
    const result = execSync('vercel whoami', { stdio: 'pipe', encoding: 'utf8' });
    console.log(`✅ Logged in to Vercel as: ${result.trim()}`);
    return true;
  } catch (error) {
    console.log('❌ Not logged in to Vercel. Please run: vercel login');
    return false;
  }
}

// Create KV database
function createKVDatabase() {
  console.log('\n📦 Creating KV database...');
  try {
    const result = execSync('vercel kv create oms-cache --region iad1', { 
      stdio: 'pipe', 
      encoding: 'utf8' 
    });
    console.log('✅ KV database "oms-cache" created successfully');
    console.log(result);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ KV database "oms-cache" already exists');
      return true;
    }
    console.error('❌ Failed to create KV database:', error.message);
    return false;
  }
}

// Create Blob store
function createBlobStore() {
  console.log('\n📁 Creating Blob store...');
  try {
    const result = execSync('vercel blob create oms-files', { 
      stdio: 'pipe', 
      encoding: 'utf8' 
    });
    console.log('✅ Blob store "oms-files" created successfully');
    console.log(result);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Blob store "oms-files" already exists');
      return true;
    }
    console.error('❌ Failed to create Blob store:', error.message);
    return false;
  }
}

// Link storage to project
function linkStorageToProject() {
  console.log('\n🔗 Linking storage to project...');
  try {
    // Link KV database
    execSync('vercel env add KV_REST_API_URL', { stdio: 'inherit' });
    execSync('vercel env add KV_REST_API_TOKEN', { stdio: 'inherit' });
    
    // Link Blob store
    execSync('vercel env add BLOB_READ_WRITE_TOKEN', { stdio: 'inherit' });
    
    console.log('✅ Storage linked to project successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to link storage:', error.message);
    return false;
  }
}

// Update local environment file
function updateLocalEnv() {
  console.log('\n📝 Updating local environment...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = `
# Vercel Storage Configuration (Auto-generated)
# KV Database for caching
KV_REST_API_URL=your_kv_url_here
KV_REST_API_TOKEN=your_kv_token_here

# Blob Storage for files
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# Note: Run 'vercel env pull .env.local' to get actual values
`;

  try {
    fs.writeFileSync(envPath, envContent.trim());
    console.log('✅ Created .env.local template');
    console.log('💡 Run "vercel env pull .env.local" to get actual values');
    return true;
  } catch (error) {
    console.error('❌ Failed to create .env.local:', error.message);
    return false;
  }
}

// Verify storage setup
function verifySetup() {
  console.log('\n🔍 Verifying storage setup...');
  
  try {
    // List KV databases
    const kvList = execSync('vercel kv ls', { stdio: 'pipe', encoding: 'utf8' });
    if (kvList.includes('oms-cache')) {
      console.log('✅ KV database "oms-cache" found');
    }
    
    // List Blob stores
    const blobList = execSync('vercel blob ls', { stdio: 'pipe', encoding: 'utf8' });
    if (blobList.includes('oms-files')) {
      console.log('✅ Blob store "oms-files" found');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Main setup function
async function setupStorage() {
  console.log('Starting Vercel Storage setup...\n');
  
  // Step 1: Check prerequisites
  if (!checkVercelCLI()) {
    process.exit(1);
  }
  
  if (!checkVercelAuth()) {
    console.log('\n💡 Please run "vercel login" first, then run this script again.');
    process.exit(1);
  }
  
  // Step 2: Create storage resources
  const kvSuccess = createKVDatabase();
  const blobSuccess = createBlobStore();
  
  if (!kvSuccess || !blobSuccess) {
    console.log('\n❌ Storage creation failed. Please check the errors above.');
    process.exit(1);
  }
  
  // Step 3: Update environment
  updateLocalEnv();
  
  // Step 4: Verify setup
  verifySetup();
  
  // Step 5: Show next steps
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 Vercel Storage setup completed successfully!');
  console.log('\n📋 Next Steps:');
  console.log('1. Run "vercel env pull .env.local" to get environment variables');
  console.log('2. Deploy your project: "vercel --prod"');
  console.log('3. Test storage endpoints:');
  console.log('   - GET /api/orders/stats (cached)');
  console.log('   - GET /api/orders/health (storage health)');
  console.log('\n💡 Your storage is now configured in vercel.json and ready to use!');
}

// Run the setup
setupStorage().catch(console.error);
