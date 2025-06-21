require('dotenv').config();

const fs = require('fs');
const path = require('path');

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
//   const schemaPath2 = path.join(__dirname, '../src/prisma/schema.prisma');

  // Ensure directories exist
  const dir1 = path.dirname(schemaPath1);
//   const dir2 = path.dirname(schemaPath2);
  
  if (!fs.existsSync(dir1)) {
    fs.mkdirSync(dir1, { recursive: true });
  }
//   if (!fs.existsSync(dir2)) {
//     fs.mkdirSync(dir2, { recursive: true });
//   }

  // Write schema files
  fs.writeFileSync(schemaPath1, schema);
//   fs.writeFileSync(schemaPath2, schema);

  console.log(`Generated schema.prisma for ${databaseProvider}`);
  console.log(`Schema written to: ${schemaPath1}`);
//   console.log(`Schema written to: ${schemaPath2}`);
}

// Main execution
const finalSchema = generateSchema();
writeSchema(finalSchema);

console.log('Schema generation completed successfully!');