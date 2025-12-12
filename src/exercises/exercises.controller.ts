import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('exercises')
@UseGuards(AuthGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  /**
   * GET /exercises/search
   * Search exercises with filters
   */
  @Get('search')
  async searchExercises(
    @CurrentUser('id') trainerId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('equipment') equipment?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.exercisesService.searchExercises(trainerId, {
      search,
      category,
      difficulty,
      equipment,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  /**
   * GET /exercises/recommended?categories=SQUAT,PUSH
   * Get recommended exercises for specific categories
   */
  @Get('recommended')
  async getRecommendedExercises(
    @CurrentUser('id') trainerId: string,
    @Query('categories') categories: string,
    @Query('difficulty') difficulty?: string,
  ) {
    // categories can be comma-separated: "SQUAT,HORIZONTAL_PUSH,CORE"
    const categoryArray = categories ? categories.split(',') : [];

    return this.exercisesService.getRecommendedExercises(
      trainerId,
      categoryArray,
      difficulty,
    );
  }

  /**
   * GET /exercises/:id
   * Get a single exercise by ID
   */
  @Get(':id')
  async findOne(@CurrentUser('id') trainerId: string, @Param('id') id: string) {
    return this.exercisesService.findOne(id, trainerId);
  }
}
