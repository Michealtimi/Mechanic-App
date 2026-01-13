/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseGuards, Req, Get, Param, Query, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { UserRequest } from 'src/common/interfaces/user-request.interface'; // Assuming this interface exists

@ApiTags('Rating')
@ApiBearerAuth() // Indicates that authentication is required for secured routes
@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  // 1. CREATE RATING (Submit Review)
  // This route is guarded and requires the user (Customer) to be authenticated.
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a new rating and review for a mechanic after a completed booking.' })
  async rate(@Req() req: UserRequest, @Body() dto: CreateRatingDto) {
    // The customer's ID is taken directly from the JWT payload for security (cannot be spoofed in the DTO)
    const customerId = req.user.id;
    return this.ratingService.createRating(dto, customerId);
  }

  // 2. LIST MECHANIC RATINGS (View Reviews)
  // This route is public and allows anyone to view a mechanic's average rating and reviews.
  @Get('mechanic/:id')
  @ApiOperation({ summary: 'Retrieve a paginated list of all reviews for a specific mechanic.' })
  @ApiParam({ name: 'id', description: 'The UUID of the Mechanic whose ratings are being requested.', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Number of items per page (default: 10)' })
  async list(
    @Param('id', ParseUUIDPipe) id: string, // Enforce UUID format for the mechanic ID
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize: number = 10, // Changed from 'take' to 'pageSize'
  ) {
    // The service method now correctly expects page and pageSize for robust pagination
    return this.ratingService.listMechanicRatings(id, page, pageSize);
  }
}