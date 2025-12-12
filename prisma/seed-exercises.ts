// import { PrismaClient } from '@prisma/client';
// import { PrismaPg } from '@prisma/adapter-pg';
// import { Pool } from 'pg';
// import * as fs from 'fs';
// import * as path from 'path';
// import 'dotenv/config';

// const url = process.env.DATABASE_URL;
// if (!url) {
//   throw new Error('DATABASE_URL is not set');
// }

// const pool = new Pool({ connectionString: url });
// const adapter = new PrismaPg(pool);

// const prisma = new PrismaClient({
//   adapter,
//   log: ['error', 'warn'],
// });

// // Mapping între categoriile din JSON și enum-ul din DB
// const CATEGORY_MAPPING: Record<string, string> = {
//   'SQUAT': 'SQUAT',
//   'LUNGE': 'LUNGE',
//   'HINGE': 'HINGE',
//   'HORIZONTAL_PUSH': 'HORIZONTAL_PUSH',
//   'HORIZONTAL_PULL': 'HORIZONTAL_PULL',
//   'VERTICAL_PUSH': 'VERTICAL_PUSH',
//   'VERTICAL_PULL': 'VERTICAL_PULL',
//   'GLUTES_HAMSTRINGS': 'GLUTES_HAMSTRINGS',
//   'CORE': 'CORE',
//   'FULL_BODY_POWER': 'FULL_BODY_POWER',
//   'CARDIO_CONDITIONING': 'CARDIO_CONDITIONING',
// };

// // Mapping pentru difficulty
// const DIFFICULTY_MAPPING: Record<string, string> = {
//   'BEGINNER': 'BEGINNER',
//   'INTERMEDIATE': 'INTERMEDIATE',
//   'ADVANCED': 'ADVANCED',
// };

// interface ExerciseJson {
//   name: string;
//   description: string;
//   how_to: string[];
//   cues: string[];
//   mistakes: string[];
//   category: string;
//   equipment: string[];
//   difficulty: string;
// }

// async function seedExercises() {
//   console.log('🌱 Starting exercises seed...');

//   // Check if exercises already exist
//   const existingExercises = await prisma.exercise.findMany({
//     where: { isDefault: true },
//   });

//   if (existingExercises.length > 0) {
//     console.log('⚠️  Default exercises already exist. Skipping seed.');
//     console.log(`   Found ${existingExercises.length} existing exercises.`);
//     return;
//   }

//   // Read exercises from JSON file
//   const jsonPath = path.join(__dirname, '..', 'exercises_120_ro.json');
//   const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
//   const exercisesData: ExerciseJson[] = JSON.parse(jsonContent);

//   console.log(`📖 Loaded ${exercisesData.length} exercises from JSON`);

//   // Seed exercises
//   let createdCount = 0;
//   let skippedCount = 0;

//   for (const exercise of exercisesData) {
//     try {
//       // Map category
//       const category = CATEGORY_MAPPING[exercise.category] || 'OTHER';
//       const difficulty = DIFFICULTY_MAPPING[exercise.difficulty] || 'BEGINNER';

//       await prisma.exercise.create({
//         data: {
//           name: exercise.name,
//           description: exercise.description,
//           howTo: exercise.how_to,
//           cues: exercise.cues,
//           mistakes: exercise.mistakes,
//           category: category,
//           equipment: exercise.equipment,
//           difficulty: difficulty,
//           isDefault: true,
//           trainerId: null, // Default exercises have no trainer
//         },
//       });

//       createdCount++;

//       // Log progress every 20 exercises
//       if (createdCount % 20 === 0) {
//         console.log(`   ... ${createdCount} exercises created`);
//       }
//     } catch (error) {
//       console.error(`❌ Error creating exercise "${exercise.name}":`, error);
//       skippedCount++;
//     }
//   }

//   console.log(`✅ Created ${createdCount} exercises`);
//   if (skippedCount > 0) {
//     console.log(`⚠️  Skipped ${skippedCount} exercises due to errors`);
//   }
//   console.log('🎉 Exercises seed completed!');
// }

// seedExercises()
//   .catch((error) => {
//     console.error('❌ Error seeding exercises:', error);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
