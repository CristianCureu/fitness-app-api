import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

const QUALITY_PROGRAMS = [
  {
    name: "Beginner Full Body - 2x/săptămână",
    description: "Perfect pentru începători absoluti. Învață pattern-urile de bază cu frecvență minimă. Repetarea acelorași exerciții ajută la învățare rapidă.",
    sessionsPerWeek: 2,
    durationWeeks: 8,
    isDefault: true,
    sessions: [
      {
        dayNumber: 1,
        name: "Full Body A",
        focus: "FULL_BODY",
        notes: "Focus: Squat pattern, Push vertical, Pull horizontal. Ex: Goblet Squat, DB Press, Cable Row, Planks"
      },
      {
        dayNumber: 2,
        name: "Full Body A",
        focus: "FULL_BODY",
        notes: "Aceleași exerciții ca prima sesiune - consolidare tehnică"
      }
    ]
  },

  {
    name: "Beginner Full Body - 3x/săptămână",
    description: "Pentru începători după primele 8 săptămâni. Progresie naturală de la 2x la 3x pe săptămână.",
    sessionsPerWeek: 3,
    durationWeeks: 12,
    isDefault: true,
    sessions: [
      {
        dayNumber: 1,
        name: "Full Body A",
        focus: "FULL_BODY",
        notes: "Focus: Squat dominant, Push vertical, Pull horizontal. Ex: Goblet Squat, DB Shoulder Press, Seated Row"
      },
      {
        dayNumber: 2,
        name: "Full Body B",
        focus: "FULL_BODY",
        notes: "Focus: Hinge dominant, Push horizontal, Pull vertical. Ex: Romanian Deadlift, DB Bench Press, Lat Pulldown"
      },
      {
        dayNumber: 3,
        name: "Full Body A",
        focus: "FULL_BODY",
        notes: "Repetare sesiunea A - consolidare"
      }
    ]
  },

  {
    name: "Upper/Lower Split - 4x/săptămână",
    description: "Split-ul clasic pentru intermediari. Echilibru perfect între volum, frecvență și recovery. Ideal pentru hipertrofie și strength.",
    sessionsPerWeek: 4,
    durationWeeks: 12,
    isDefault: true,
    sessions: [
      {
        dayNumber: 1,
        name: "Upper Body A - Strength",
        focus: "UPPER",
        notes: "Focus: Strength cu greutăți mari. Ex: Bench Press 4x6, Barbell Row 4x6, DB Shoulder Press 3x8"
      },
      {
        dayNumber: 2,
        name: "Lower Body A - Squat Focus",
        focus: "LOWER",
        notes: "Focus: Squat pattern + accessories. Ex: Back Squat 4x6, Romanian Deadlift 3x8, Leg Press 3x12"
      },
      {
        dayNumber: 3,
        name: "Upper Body B - Hypertrophy",
        focus: "UPPER",
        notes: "Focus: Volum și pompă. Ex: Incline DB Press 4x10, Cable Row 4x12, Lateral Raises 3x15"
      },
      {
        dayNumber: 4,
        name: "Lower Body B - Deadlift Focus",
        focus: "LOWER",
        notes: "Focus: Hinge pattern + accessories. Ex: Deadlift 4x5, Bulgarian Split Squat 3x10, Leg Curl 3x12"
      }
    ]
  },

  {
    name: "Push/Pull/Legs - 6x/săptămână",
    description: "Pentru avansați cu commitment ridicat. Fiecare grup muscular antrenat de 2x pe săptămână. Volum mare, rezultate maxime.",
    sessionsPerWeek: 6,
    durationWeeks: 8,
    isDefault: true,
    sessions: [
      {
        dayNumber: 1,
        name: "Push A - Strength",
        focus: "PUSH",
        notes: "Focus: Chest și triceps, greutăți mari. Ex: Bench Press 4x6, Incline DB Press 3x8, Dips 3x8"
      },
      {
        dayNumber: 2,
        name: "Pull A - Strength",
        focus: "PULL",
        notes: "Focus: Back și biceps, greutăți mari. Ex: Deadlift 4x5, Pull-ups 4x6, Barbell Row 3x8"
      },
      {
        dayNumber: 3,
        name: "Legs A - Quad Focus",
        focus: "LEGS",
        notes: "Focus: Squat pattern. Ex: Back Squat 4x6, Front Squat 3x8, Leg Press 3x12, Leg Extension 3x15"
      },
      {
        dayNumber: 4,
        name: "Push B - Hypertrophy",
        focus: "PUSH",
        notes: "Focus: Volum pentru shoulders și triceps. Ex: DB Shoulder Press 4x10, Cable Flies 3x12, Overhead Tricep Ext 3x12"
      },
      {
        dayNumber: 5,
        name: "Pull B - Hypertrophy",
        focus: "PULL",
        notes: "Focus: Volum pentru back și biceps. Ex: Lat Pulldown 4x12, Cable Row 4x12, Face Pulls 3x15, Curls 3x12"
      },
      {
        dayNumber: 6,
        name: "Legs B - Hamstring Focus",
        focus: "LEGS",
        notes: "Focus: Hinge pattern. Ex: Romanian Deadlift 4x8, Leg Curl 4x10, Bulgarian Split Squat 3x10, Calf Raises 4x15"
      }
    ]
  },

  {
    name: "Fat Loss Circuit - 3x/săptămână",
    description: "Design pentru pierdere în greutate. Densitate mare, compound movements, cardio metabolic. Perfect combinat cu deficit caloric.",
    sessionsPerWeek: 3,
    durationWeeks: 8,
    isDefault: true,
    sessions: [
      {
        dayNumber: 1,
        name: "Full Body Circuit A",
        focus: "FULL_BODY",
        notes: "Circuit: Squat variations, Push-ups, Rows, Burpees. 3-4 runde, pauze mici (30-45sec)"
      },
      {
        dayNumber: 2,
        name: "Full Body Circuit B",
        focus: "FULL_BODY",
        notes: "Circuit: Deadlift variations, DB Press, Pull movements, Mountain Climbers. Tempo rapid, focus pe intensitate"
      },
      {
        dayNumber: 3,
        name: "Full Body Circuit C",
        focus: "FULL_BODY",
        notes: "Circuit: Lunges, Dips, Face Pulls, KB Swings. Mix strength + cardio pentru burn maxim"
      }
    ]
  },

  {
    name: "Strength Focus - 4x/săptămână",
    description: "Pentru cei care vor să crească greutățile pe bare. Focus pe compound lifts cu progressive overload sistematic.",
    sessionsPerWeek: 4,
    durationWeeks: 12,
    isDefault: true,
    sessions: [
      {
        dayNumber: 1,
        name: "Squat Day",
        focus: "LEGS",
        notes: "Main: Back Squat 5x5. Accessories: Front Squat 3x6, Leg Press 3x10. Focus pe tehnică perfectă și progresie liniară"
      },
      {
        dayNumber: 2,
        name: "Bench Press Day",
        focus: "PUSH",
        notes: "Main: Bench Press 5x5. Accessories: Incline Press 3x8, DB Flies 3x10, Tricep work. Push pentru upper body strength"
      },
      {
        dayNumber: 3,
        name: "Deadlift Day",
        focus: "PULL",
        notes: "Main: Deadlift 5x3 (greutăți mari). Accessories: Romanian DL 3x8, Barbell Row 4x6. Posterior chain dominance"
      },
      {
        dayNumber: 4,
        name: "Overhead Press Day",
        focus: "UPPER",
        notes: "Main: OHP 5x5. Accessories: Pull-ups 4x6, DB Rows 3x10, Lateral Raises 3x12. Shoulders + back balance"
      }
    ]
  }
];

async function seedPrograms() {
  console.log('🌱 Starting workout programs seed...');

  // Check if programs already exist
  const existingPrograms = await prisma.workoutProgram.findMany({
    where: { isDefault: true },
  });

  if (existingPrograms.length > 0) {
    console.log('⚠️  Default programs already exist. Skipping seed.');
    console.log(`   Found ${existingPrograms.length} existing programs.`);
    return;
  }

  // Seed programs
  for (const program of QUALITY_PROGRAMS) {
    const created = await prisma.workoutProgram.create({
      data: {
        name: program.name,
        description: program.description,
        sessionsPerWeek: program.sessionsPerWeek,
        durationWeeks: program.durationWeeks,
        isDefault: program.isDefault,
        trainerId: null, // Default programs have no trainer
        sessions: {
          create: program.sessions,
        },
      },
      include: {
        sessions: true,
      },
    });

    console.log(`✅ Created: ${created.name} (${created.sessions.length} sessions)`);
  }

  console.log('🎉 Workout programs seed completed!');
}

seedPrograms()
  .catch((error) => {
    console.error('❌ Error seeding programs:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
