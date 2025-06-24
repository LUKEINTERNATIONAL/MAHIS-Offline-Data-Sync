require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the DATABASE_PROVIDER from environment
const databaseProvider = process.env.DATABASE_PROVIDER;

if (!databaseProvider) {
  console.error('DATABASE_PROVIDER environment variable is required');
  process.exit(1);
}

// Define paths
const templatesDir = path.join(__dirname, '../templates');
const modelsDir = path.join(__dirname, '../models');
const srcPrismaDir = path.join(__dirname, '../src/modules/prisma');

// Read the base template
const baseTemplatePath = path.join(templatesDir, 'base.template.prisma');
if (!fs.existsSync(baseTemplatePath)) {
  console.error(`Base template not found at: ${baseTemplatePath}`);
  process.exit(1);
}

const baseTemplate = fs.readFileSync(baseTemplatePath, 'utf8');

// Function to process conditional blocks in templates
function processConditionals(content, provider) {
  let processedContent = content;
  
  if (provider === 'mongodb') {
    // Remove SQLite-specific parts and keep MongoDB parts
    processedContent = processedContent.replace(/\{\{#if_mongodb\}\}/g, '');
    processedContent = processedContent.replace(/\{\{\/if_mongodb\}\}/g, '');
    processedContent = processedContent.replace(/\{\{#if_sqlite\}\}[\s\S]*?\{\{\/if_sqlite\}\}/g, '');
  } else {
    // Remove MongoDB-specific parts and keep SQLite parts
    processedContent = processedContent.replace(/\{\{#if_sqlite\}\}/g, '');
    processedContent = processedContent.replace(/\{\{\/if_sqlite\}\}/g, '');
    processedContent = processedContent.replace(/\{\{#if_mongodb\}\}[\s\S]*?\{\{\/if_mongodb\}\}/g, '');
  }
  
  return processedContent;
}

// Function to read and process all model files
function readModelFiles(modelsDirectory, provider) {
  if (!fs.existsSync(modelsDirectory)) {
    console.error(`Models directory not found at: ${modelsDirectory}`);
    return '';
  }

  const modelFiles = fs.readdirSync(modelsDirectory)
    .filter(file => file.endsWith('.template.prisma'))
    .sort(); // Sort to ensure consistent ordering

  let allModels = '';

  modelFiles.forEach(file => {
    const filePath = path.join(modelsDirectory, file);
    const modelContent = fs.readFileSync(filePath, 'utf8');
    const processedModel = processConditionals(modelContent, provider);
    
    allModels += processedModel + '\n\n';
    console.log(`Processed model: ${file}`);
  });

  return allModels.trim();
}

// Generate the complete schema
function generateSchema() {
  try {
    // Process base template
    let schema = baseTemplate.replace('{{DATABASE_PROVIDER}}', databaseProvider);
    schema = processConditionals(schema, databaseProvider);

    // Read and append all models
    const modelsContent = readModelFiles(modelsDir, databaseProvider);
    
    // Combine base template with models
    schema += '\n\n' + modelsContent;

    return schema;
  } catch (error) {
    console.error('Error generating schema:', error.message);
    process.exit(1);
  }
}

// Write schema to files
function writeSchema(schema) {
  // Create src/prisma directory if it doesn't exist
  if (!fs.existsSync(srcPrismaDir)) {
    fs.mkdirSync(srcPrismaDir, { recursive: true });
  }

  // Define output paths
  const schemaPath1 = path.join(__dirname, '../src/modules/prisma/schema.prisma');

  // Ensure directories exist
  const dir1 = path.dirname(schemaPath1);
  
  if (!fs.existsSync(dir1)) {
    fs.mkdirSync(dir1, { recursive: true });
  }

  // Write schema files
  fs.writeFileSync(schemaPath1, schema);

  console.log(`Generated schema.prisma for ${databaseProvider}`);
  console.log(`Schema written to: ${schemaPath1}`);
}

// Function to run SQLite migration
function runSQLiteMigration() {
  if (databaseProvider.toLowerCase() === 'sqlite') {
    console.log('\nRunning SQLite migration...');
    try {
      // Run the migration command
      execSync('npx prisma migrate dev --name init', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')  // Run from project root
      });
      console.log('SQLite migration completed successfully!');
    } catch (error) {
      console.error('Error running SQLite migration:', error.message);
      console.log('You may need to run the migration manually: npx prisma migrate dev --name init');
    }
  } else {
    console.log(`Skipping migration - not applicable for ${databaseProvider}`);
  }
}

// Main execution
const finalSchema = generateSchema();
writeSchema(finalSchema);

console.log('Schema generation completed successfully!');

// Run migration if SQLite
runSQLiteMigration();