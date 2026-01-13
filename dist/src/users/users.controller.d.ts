import { UsersService } from './users.service';
import { CreateUserDto, SignupMechanicDto, UpdateUserDto, UserFilterDto } from './dto/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(createUserDto: CreateUserDto): Promise<unknown>;
    signupMechanic(signupMechanicDto: SignupMechanicDto): Promise<unknown>;
    findAll(filterDto: UserFilterDto): Promise<{
        data: unknown[];
        meta: any;
    }>;
    findOne(id: string, req: any): Promise<unknown[]>;
    update(id: string, updateUserDto: UpdateUserDto, req: any): Promise<unknown[]>;
    remove(id: string): Promise<void>;
    updateMechanicAvailability(id: string, isAvailableForJobs: boolean, req: any): Promise<unknown[]>;
    updateMechanicOnlineStatus(id: string, status: string, req: any): Promise<unknown[]>;
}
