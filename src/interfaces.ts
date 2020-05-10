import { DynamoDB } from 'aws-sdk';

export interface IDynamoDBSessionManagerOptions {
    dynamoDB: DynamoDB;
    table: string;
    chatKey: string;
}