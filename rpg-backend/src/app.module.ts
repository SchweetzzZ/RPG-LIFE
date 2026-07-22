import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: ['.env', '../.env']
  }),
  MongooseModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      uri: configService.get<string>('MONGO_URI'),
    }),
    inject: [ConfigService],
  }),
    //true imports here :)
    UserModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
