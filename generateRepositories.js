const fs = require('fs');
const path = require('path');

const entitiesDir = path.join(__dirname, 'src/entities');
const repositoriesDir = path.join(__dirname, 'src/repositories');

if (!fs.existsSync(repositoriesDir)) {
  fs.mkdirSync(repositoriesDir);
}

function getPrimaryColumnName(entityFilePath) {
  const lines = fs.readFileSync(entityFilePath, 'utf-8').split('\n');
  let primaryColumn = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes('@Column') && line.includes('primary: true')) {
      const nextLine = lines[i + 1]?.trim();
      const match = nextLine && nextLine.match(/(\w+)\s*:/);
      if (match) {
        primaryColumn = match[1];
        break;
      }
    }
  }

  if (!primaryColumn) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('@Column')) {
        const nextLine = lines[i + 1]?.trim();
        const match = nextLine && nextLine.match(/(\w+)\s*:/);
        if (match) {
          primaryColumn = match[1];
          break;
        }
      }
    }
  }

  if (!primaryColumn) {
    throw new Error(`Entity in ${entityFilePath} does not have a primary column or any fallback column.`);
  }

  return primaryColumn;
}

const template = (entityFileName, entityName, primaryColumn) => `
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { ${entityName} } from '../entities/${entityFileName}';

@CustomRepository(${entityName})
export class ${entityFileName}Repository extends Repository<${entityName}> {

  async findBy${capitalize(primaryColumn)}(${primaryColumn}: string): Promise<${entityName} | null> {
    return this.createQueryBuilder('${entityFileName.toLowerCase()}')
      .where('${entityFileName.toLowerCase()}.${primaryColumn} = :${primaryColumn}', { ${primaryColumn} })
      .getOne();
  }

  async getAllSorted(): Promise<${entityName}[]> {
    return this.createQueryBuilder('${entityFileName.toLowerCase()}')
      .orderBy('${entityFileName.toLowerCase()}.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<${entityName}> {
    const entity = await this.createQueryBuilder('${entityFileName.toLowerCase()}')
      .where('${entityFileName.toLowerCase()}.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(\`\${${entityName}} not found with id: \${id}\`);
    }

    return entity;
  }
}
`;

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

fs.readdirSync(entitiesDir)
  .filter((file) => file.endsWith('.ts'))
  .forEach((file) => {
    const entityFilePath = path.join(entitiesDir, file);
    const entityName = file.replace('.ts', '');

    try {
      const primaryColumn = getPrimaryColumnName(entityFilePath);
      const repositoryFile = path.join(repositoriesDir, `${entityName}Repository.ts`);
      fs.writeFileSync(repositoryFile, template(entityName, `${entityName}`, primaryColumn));
      console.log(`Generated repository for ${entityName} with primary column ${primaryColumn}`);
    } catch (error) {
      console.error(`Error generating repository for ${entityName}:`, error.message);
    }
  });

console.log("Repository generation completed!");
