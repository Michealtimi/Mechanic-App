import { CreateMechanicServiceDto } from './create-mechanic-service.dto';
declare const UpdateServiceDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateMechanicServiceDto>>;
export declare class UpdateServiceDto extends UpdateServiceDto_base {
    id: string;
}
export {};
