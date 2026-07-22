import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document } from "mongoose"

export type UserDocument = User & Document

export enum UserRole {
    PLAYER = 'player',
    ADMIN = 'admin'
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
    @Prop({ required: true, unique: true, trim: true, lowercase: true })
    email: string

    @Prop({ required: true })
    username: string

    @Prop({ required: true })
    password: string

    @Prop({ type: String, enum: UserRole, default: UserRole.PLAYER })
    role: UserRole

    @Prop({ default: true })
    isActive: boolean
}

export const UserSchema = SchemaFactory.createForClass(User)