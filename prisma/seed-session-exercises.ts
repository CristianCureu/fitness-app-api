import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

// Helper function pentru a găsi exerciții by name
async function findExerciseByName(name: string) {
  return await prisma.exercise.findFirst({
    where: { name, isDefault: true }
  });
}

// Helper function pentru a crea session exercise
async function createSessionExercise(
  sessionId: string,
  exerciseName: string,
  orderInSession: number,
  sets: number,
  reps: string,
  restSeconds: number,
  notes?: string
) {
  const exercise = await findExerciseByName(exerciseName);
  if (!exercise) {
    console.warn(`⚠️  Exercise not found: ${exerciseName}`);
    return null;
  }

  return await prisma.sessionExercise.create({
    data: {
      sessionId,
      exerciseId: exercise.id,
      orderInSession,
      sets,
      reps,
      restSeconds,
      notes
    }
  });
}

async function seedSessionExercises() {
  console.log('🌱 Starting session exercises seed...');

  // Check if session exercises already exist
  const existingSessionExercises = await prisma.sessionExercise.count();
  if (existingSessionExercises > 0) {
    console.log('⚠️  Session exercises already exist. Skipping seed.');
    console.log(`   Found ${existingSessionExercises} existing session exercises.`);
    return;
  }

  // Fetch all programs with their sessions
  const programs = await prisma.workoutProgram.findMany({
    where: { isDefault: true },
    include: { sessions: true },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`📖 Found ${programs.length} programs to populate with exercises\n`);

  let totalCreated = 0;

  // ============================================
  // 1. Beginner Full Body - 2x/săptămână
  // ============================================
  const beginnerFullBody2x = programs.find(p => p.name === "Beginner Full Body - 2x/săptămână");
  if (beginnerFullBody2x) {
    console.log(`📝 Processing: ${beginnerFullBody2x.name}`);

    // Zi 1 și Zi 2 - aceleași exerciții (consolidare tehnică)
    for (const session of beginnerFullBody2x.sessions) {
      await createSessionExercise(session.id, "Goblet Squat (Dumbbell)", 1, 3, "10-12", 90, "Focus pe tehnică și amplitudine completă");
      await createSessionExercise(session.id, "Seated Dumbbell Shoulder Press", 2, 3, "8-10", 75, "Pieptul sus, core strâns");
      await createSessionExercise(session.id, "One-Arm Dumbbell Row", 3, 3, "10-12", 75, "Trageți cotul înapoi, nu ridica umărul");
      await createSessionExercise(session.id, "Front Plank", 4, 3, "30-45 sec", 60, "Poziție neutră a spatelui");
      totalCreated += 4;
    }
    console.log(`   ✅ Created exercises for ${beginnerFullBody2x.sessions.length} sessions\n`);
  }

  // ============================================
  // 2. Beginner Full Body - 3x/săptămână
  // ============================================
  const beginnerFullBody3x = programs.find(p => p.name === "Beginner Full Body - 3x/săptămână");
  if (beginnerFullBody3x) {
    console.log(`📝 Processing: ${beginnerFullBody3x.name}`);

    const sessions = beginnerFullBody3x.sessions.sort((a, b) => a.dayNumber - b.dayNumber);

    // Zi 1 - Full Body A (Squat dominant, Push vertical, Pull horizontal)
    if (sessions[0]) {
      await createSessionExercise(sessions[0].id, "Goblet Squat (Dumbbell)", 1, 3, "10-12", 90);
      await createSessionExercise(sessions[0].id, "Seated Dumbbell Shoulder Press", 2, 3, "8-10", 75);
      await createSessionExercise(sessions[0].id, "Seated Cable Row", 3, 3, "10-12", 75);
      await createSessionExercise(sessions[0].id, "Front Plank", 4, 3, "30-45 sec", 60);
      totalCreated += 4;
    }

    // Zi 2 - Full Body B (Hinge dominant, Push horizontal, Pull vertical)
    if (sessions[1]) {
      await createSessionExercise(sessions[1].id, "Romanian Deadlift (Dumbbell)", 1, 3, "10-12", 90);
      await createSessionExercise(sessions[1].id, "Dumbbell Bench Press", 2, 3, "8-10", 75);
      await createSessionExercise(sessions[1].id, "Wide-Grip Lat Pulldown", 3, 3, "10-12", 75);
      await createSessionExercise(sessions[1].id, "Dead Bug", 4, 3, "10-12", 60);
      totalCreated += 4;
    }

    // Zi 3 - Full Body A (repetare)
    if (sessions[2]) {
      await createSessionExercise(sessions[2].id, "Goblet Squat (Dumbbell)", 1, 3, "10-12", 90);
      await createSessionExercise(sessions[2].id, "Seated Dumbbell Shoulder Press", 2, 3, "8-10", 75);
      await createSessionExercise(sessions[2].id, "Seated Cable Row", 3, 3, "10-12", 75);
      await createSessionExercise(sessions[2].id, "Front Plank", 4, 3, "30-45 sec", 60);
      totalCreated += 4;
    }

    console.log(`   ✅ Created exercises for ${sessions.length} sessions\n`);
  }

  // ============================================
  // 3. Upper/Lower Split - 4x/săptămână
  // ============================================
  const upperLower = programs.find(p => p.name === "Upper/Lower Split - 4x/săptămână");
  if (upperLower) {
    console.log(`📝 Processing: ${upperLower.name}`);

    const sessions = upperLower.sessions.sort((a, b) => a.dayNumber - b.dayNumber);

    // Zi 1 - Upper Body A - Strength
    if (sessions[0]) {
      await createSessionExercise(sessions[0].id, "Barbell Bench Press", 1, 4, "6", 120, "Strength cu greutăți mari");
      await createSessionExercise(sessions[0].id, "Barbell Bent-Over Row", 2, 4, "6", 120);
      await createSessionExercise(sessions[0].id, "Seated Dumbbell Shoulder Press", 3, 3, "8", 90);
      await createSessionExercise(sessions[0].id, "Assisted Pull-Up Machine", 4, 3, "6-8", 90);
      await createSessionExercise(sessions[0].id, "Dumbbell Front Raise", 5, 3, "10-12", 60);
      totalCreated += 5;
    }

    // Zi 2 - Lower Body A - Squat Focus
    if (sessions[1]) {
      await createSessionExercise(sessions[1].id, "Barbell Back Squat", 1, 4, "6", 120, "Focus pe tehnică perfectă");
      await createSessionExercise(sessions[1].id, "Romanian Deadlift (Barbell)", 2, 3, "8", 90);
      await createSessionExercise(sessions[1].id, "Leg Press Machine", 3, 3, "12", 90);
      await createSessionExercise(sessions[1].id, "Walking Lunge", 4, 3, "10", 75);
      await createSessionExercise(sessions[1].id, "Dumbbell Hip Thrust", 5, 3, "15", 60);
      totalCreated += 5;
    }

    // Zi 3 - Upper Body B - Hypertrophy
    if (sessions[2]) {
      await createSessionExercise(sessions[2].id, "Dumbbell Incline Bench Press", 1, 4, "10", 90, "Focus pe pompă și volum");
      await createSessionExercise(sessions[2].id, "Seated Cable Row", 2, 4, "12", 75);
      await createSessionExercise(sessions[2].id, "Dumbbell Lateral Raise", 3, 3, "15", 60);
      await createSessionExercise(sessions[2].id, "Cable Chest Fly", 4, 3, "15", 60);
      await createSessionExercise(sessions[2].id, "Cable Lateral Raise", 5, 3, "12", 60);
      totalCreated += 5;
    }

    // Zi 4 - Lower Body B - Deadlift Focus
    if (sessions[3]) {
      await createSessionExercise(sessions[3].id, "Conventional Deadlift", 1, 4, "5", 150, "Greutăți mari, tehnică perfectă");
      await createSessionExercise(sessions[3].id, "Bulgarian Split Squat (Dumbbell)", 2, 3, "10", 90);
      await createSessionExercise(sessions[3].id, "Lying Leg Curl Machine", 3, 3, "12", 75);
      await createSessionExercise(sessions[3].id, "Barbell Hip Thrust", 4, 3, "12", 90);
      await createSessionExercise(sessions[3].id, "Hanging Knee Raise", 5, 3, "10-15", 60);
      totalCreated += 5;
    }

    console.log(`   ✅ Created exercises for ${sessions.length} sessions\n`);
  }

  // ============================================
  // 4. Push/Pull/Legs - 6x/săptămână
  // ============================================
  const ppl = programs.find(p => p.name === "Push/Pull/Legs - 6x/săptămână");
  if (ppl) {
    console.log(`📝 Processing: ${ppl.name}`);

    const sessions = ppl.sessions.sort((a, b) => a.dayNumber - b.dayNumber);

    // Zi 1 - Push A - Strength
    if (sessions[0]) {
      await createSessionExercise(sessions[0].id, "Barbell Bench Press", 1, 4, "6", 120);
      await createSessionExercise(sessions[0].id, "Dumbbell Incline Bench Press", 2, 3, "8", 90);
      await createSessionExercise(sessions[0].id, "Push-Up", 3, 3, "10-12", 90);
      await createSessionExercise(sessions[0].id, "Seated Dumbbell Shoulder Press", 4, 3, "10", 75);
      await createSessionExercise(sessions[0].id, "Cable Lateral Raise", 5, 3, "12", 60);
      totalCreated += 5;
    }

    // Zi 2 - Pull A - Strength
    if (sessions[1]) {
      await createSessionExercise(sessions[1].id, "Conventional Deadlift", 1, 4, "5", 150);
      await createSessionExercise(sessions[1].id, "Pull-Up (Pronated Grip)", 2, 4, "6", 120);
      await createSessionExercise(sessions[1].id, "Barbell Bent-Over Row", 3, 3, "8", 90);
      await createSessionExercise(sessions[1].id, "Cable Chest Fly", 4, 3, "15", 60);
      await createSessionExercise(sessions[1].id, "Arnold Press", 5, 3, "10", 75);
      totalCreated += 5;
    }

    // Zi 3 - Legs A - Quad Focus
    if (sessions[2]) {
      await createSessionExercise(sessions[2].id, "Barbell Back Squat", 1, 4, "6", 120);
      await createSessionExercise(sessions[2].id, "Barbell Front Squat", 2, 3, "8", 90);
      await createSessionExercise(sessions[2].id, "Leg Press Machine", 3, 3, "12", 90);
      await createSessionExercise(sessions[2].id, "Walking Lunge", 4, 3, "12", 75);
      await createSessionExercise(sessions[2].id, "Dumbbell Hip Thrust", 5, 4, "15", 60);
      totalCreated += 5;
    }

    // Zi 4 - Push B - Hypertrophy
    if (sessions[3]) {
      await createSessionExercise(sessions[3].id, "Seated Dumbbell Shoulder Press", 1, 4, "10", 90);
      await createSessionExercise(sessions[3].id, "Dumbbell Incline Bench Press", 2, 3, "12", 75);
      await createSessionExercise(sessions[3].id, "Cable Chest Fly", 3, 3, "12", 60);
      await createSessionExercise(sessions[3].id, "Dumbbell Lateral Raise", 4, 3, "15", 60);
      await createSessionExercise(sessions[3].id, "Dumbbell Front Raise", 5, 3, "12", 60);
      totalCreated += 5;
    }

    // Zi 5 - Pull B - Hypertrophy
    if (sessions[4]) {
      await createSessionExercise(sessions[4].id, "Wide-Grip Lat Pulldown", 1, 4, "12", 75);
      await createSessionExercise(sessions[4].id, "Seated Cable Row", 2, 4, "12", 75);
      await createSessionExercise(sessions[4].id, "Cable Chest Fly", 3, 3, "15", 60);
      await createSessionExercise(sessions[4].id, "Dumbbell Upright Row", 4, 3, "15", 60);
      await createSessionExercise(sessions[4].id, "Arnold Press", 5, 3, "12", 60);
      totalCreated += 5;
    }

    // Zi 6 - Legs B - Hamstring Focus
    if (sessions[5]) {
      await createSessionExercise(sessions[5].id, "Romanian Deadlift (Barbell)", 1, 4, "8", 120);
      await createSessionExercise(sessions[5].id, "Lying Leg Curl Machine", 2, 4, "10", 75);
      await createSessionExercise(sessions[5].id, "Bulgarian Split Squat (Dumbbell)", 3, 3, "10", 90);
      await createSessionExercise(sessions[5].id, "Barbell Hip Thrust", 4, 3, "12", 90);
      await createSessionExercise(sessions[5].id, "Dumbbell Hip Thrust", 5, 4, "15", 60);
      totalCreated += 5;
    }

    console.log(`   ✅ Created exercises for ${sessions.length} sessions\n`);
  }

  // ============================================
  // 5. Fat Loss Circuit - 3x/săptămână
  // ============================================
  const fatLoss = programs.find(p => p.name === "Fat Loss Circuit - 3x/săptămână");
  if (fatLoss) {
    console.log(`📝 Processing: ${fatLoss.name}`);

    const sessions = fatLoss.sessions.sort((a, b) => a.dayNumber - b.dayNumber);

    // Zi 1 - Full Body Circuit A
    if (sessions[0]) {
      await createSessionExercise(sessions[0].id, "Goblet Squat (Dumbbell)", 1, 3, "15", 30, "Circuit: pauze mici");
      await createSessionExercise(sessions[0].id, "Push-Up", 2, 3, "12-15", 30);
      await createSessionExercise(sessions[0].id, "One-Arm Dumbbell Row", 3, 3, "15", 30);
      await createSessionExercise(sessions[0].id, "Burpee", 4, 3, "10", 30);
      await createSessionExercise(sessions[0].id, "Battle Rope Waves", 5, 3, "20 sec", 45);
      totalCreated += 5;
    }

    // Zi 2 - Full Body Circuit B
    if (sessions[1]) {
      await createSessionExercise(sessions[1].id, "Romanian Deadlift (Dumbbell)", 1, 3, "15", 30);
      await createSessionExercise(sessions[1].id, "Dumbbell Bench Press", 2, 3, "12-15", 30);
      await createSessionExercise(sessions[1].id, "Wide-Grip Lat Pulldown", 3, 3, "15", 30);
      await createSessionExercise(sessions[1].id, "Medicine Ball Slam", 4, 3, "12", 30);
      await createSessionExercise(sessions[1].id, "Front Plank", 5, 3, "45 sec", 45);
      totalCreated += 5;
    }

    // Zi 3 - Full Body Circuit C
    if (sessions[2]) {
      await createSessionExercise(sessions[2].id, "Walking Lunge", 1, 3, "20", 30);
      await createSessionExercise(sessions[2].id, "Push-Up", 2, 3, "10-12", 30);
      await createSessionExercise(sessions[2].id, "Cable Chest Fly", 3, 3, "15", 30);
      await createSessionExercise(sessions[2].id, "Kettlebell Swing", 4, 3, "15", 30);
      await createSessionExercise(sessions[2].id, "Russian Twist (Dumbbell)", 5, 3, "20", 45);
      totalCreated += 5;
    }

    console.log(`   ✅ Created exercises for ${sessions.length} sessions\n`);
  }

  // ============================================
  // 6. Strength Focus - 4x/săptămână
  // ============================================
  const strengthFocus = programs.find(p => p.name === "Strength Focus - 4x/săptămână");
  if (strengthFocus) {
    console.log(`📝 Processing: ${strengthFocus.name}`);

    const sessions = strengthFocus.sessions.sort((a, b) => a.dayNumber - b.dayNumber);

    // Zi 1 - Squat Day
    if (sessions[0]) {
      await createSessionExercise(sessions[0].id, "Barbell Back Squat", 1, 5, "5", 180, "Progressive overload - main lift");
      await createSessionExercise(sessions[0].id, "Barbell Front Squat", 2, 3, "6", 120);
      await createSessionExercise(sessions[0].id, "Leg Press Machine", 3, 3, "10", 90);
      await createSessionExercise(sessions[0].id, "Romanian Deadlift (Barbell)", 4, 3, "8", 90);
      totalCreated += 4;
    }

    // Zi 2 - Bench Press Day
    if (sessions[1]) {
      await createSessionExercise(sessions[1].id, "Barbell Bench Press", 1, 5, "5", 180, "Progressive overload - main lift");
      await createSessionExercise(sessions[1].id, "Dumbbell Incline Bench Press", 2, 3, "8", 90);
      await createSessionExercise(sessions[1].id, "Cable Chest Fly", 3, 3, "10", 75);
      await createSessionExercise(sessions[1].id, "Cable Lateral Raise", 4, 3, "12", 60);
      totalCreated += 4;
    }

    // Zi 3 - Deadlift Day
    if (sessions[2]) {
      await createSessionExercise(sessions[2].id, "Conventional Deadlift", 1, 5, "3", 180, "Greutăți mari - main lift");
      await createSessionExercise(sessions[2].id, "Romanian Deadlift (Barbell)", 2, 3, "8", 120);
      await createSessionExercise(sessions[2].id, "Barbell Bent-Over Row", 3, 4, "6", 120);
      await createSessionExercise(sessions[2].id, "Pull-Up (Pronated Grip)", 4, 3, "6-8", 90);
      totalCreated += 4;
    }

    // Zi 4 - Overhead Press Day
    if (sessions[3]) {
      await createSessionExercise(sessions[3].id, "Standing Barbell Overhead Press", 1, 5, "5", 180, "Main lift");
      await createSessionExercise(sessions[3].id, "Pull-Up (Pronated Grip)", 2, 4, "6", 120);
      await createSessionExercise(sessions[3].id, "One-Arm Dumbbell Row", 3, 3, "10", 90);
      await createSessionExercise(sessions[3].id, "Dumbbell Lateral Raise", 4, 3, "12", 60);
      totalCreated += 4;
    }

    console.log(`   ✅ Created exercises for ${sessions.length} sessions\n`);
  }

  console.log(`\n🎉 Session exercises seed completed!`);
  console.log(`✅ Total session exercises created: ${totalCreated}`);
}

seedSessionExercises()
  .catch((error) => {
    console.error('❌ Error seeding session exercises:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
