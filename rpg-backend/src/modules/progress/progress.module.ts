import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Progress, ProgressSchema } from "./schema/progress-schema";
import { ProgressService } from "./progress.service";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Progress.name, schema: ProgressSchema }])
    ],
    providers: [
        ProgressService
    ],
    exports: [
        ProgressService,
        MongooseModule
    ]
})
export class ProgressModule { }
