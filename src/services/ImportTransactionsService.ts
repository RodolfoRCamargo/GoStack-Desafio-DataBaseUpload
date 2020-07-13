import { getCustomRepository, getRepository, In } from 'typeorm';
import csv from 'csv-parse';
import fs from 'fs';

import uploadConfig from '../config/uploads';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  filename: string;
}

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);    

    const fullPath = `${uploadConfig.directory}/${filename}`;

    const transactionsArr: CSVTransaction[] = [];
    const categoriesArr: string[] = [];

    console.log(`createReadStream ${fullPath}`);
    const readCsv = fs.createReadStream(fullPath).pipe(
      csv({ from_line: 2 }).on('data', rows => {
        const [title, type, value, category] = rows.map((cell: string) =>
          cell.trim(),
        );

        console.log(`Debug Passou ${1}`);

        console.log(`Debug propriedades ${title}-${type}-${value}`);
        if (!title || !type || !value) return;

        categoriesArr.push(category);

        transactionsArr.push({
          title,
          type,
          value,
          category,
        });
      }),
    );

    await new Promise(resolve => readCsv.on('end', resolve));

    const categoryExists = await categoryRepository.find({
      where: {
        title: In(categoriesArr),
      },
    });

    const categoriesMap = categoryExists.map(
      (category: Category) => category.title,
    );

    const addCategories = categoriesArr
      .filter(category => !categoriesMap.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const categories = categoryRepository.create(
      addCategories.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(categories);

    const allCategories = [...categories, ...categoryExists];

    const transactions = transactionRepository.create(
      transactionsArr.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(transactions);

    await fs.promises.unlink(fullPath);

    return transactions;
  }
}

export default ImportTransactionsService;