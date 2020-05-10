import { ISessionManager, ISessionStore } from '@bot-engine/core';
import { DynamoDB } from 'aws-sdk';
import { AttributeMap } from 'aws-sdk/clients/dynamodb';

import { IDynamoDBSessionManagerOptions } from './interfaces';

class Session implements ISessionStore {
    manager: DynamoDBSessionManager;
    id: string;
    data: any;

    constructor(id: string, manager: DynamoDBSessionManager) {
        this.manager = manager;
        this.id = id;
        this.data = { };
    }

    async initialize() {
        this.data = await this.manager.retrieveItem(this.id);
    }

    async set(key: String, value: any): Promise<void> {
        this.data[key.toString()] = value;
        await this.manager.updateItem(this.id, this.data);
    }

    get(key: String): Promise<any> {
        return this.data[key.toString()] || null;
    }
}

export default class DynamoDBSessionManager implements ISessionManager {
    options: IDynamoDBSessionManagerOptions;
    sessionCache: any;

    constructor(options: IDynamoDBSessionManagerOptions) {
        this.options = options;
        this.sessionCache = { };
    }

    async retrieveItem(id: string) {
        const {
            Item,
        } = await this.options.dynamoDB.getItem({
            TableName: this.options.table,
            Key: {
                [this.options.chatKey]: {
                    S: id,
                },
            },
        }).promise();

        if (!Item) {
            return { };
        }

        return DynamoDB.Converter.unmarshall(Item);
    }

    async updateItem(id: string, data: any) {
        await this.options.dynamoDB.putItem({
            Item: DynamoDB.Converter.marshall({
                ...data,
                [this.options.chatKey]: id,
            }),
            TableName: this.options.table,
        }).promise();
    }

    async createSession(id: string): Promise<Session> {
        const newSession = new Session(id, this);
        await newSession.initialize();
        return newSession;
    }

    async getSessionStore(id: string): Promise<ISessionStore> {
        if (this.sessionCache[id]) {
            return this.sessionCache[id];
        }

        const newSession = await this.createSession(id);
        this.sessionCache[id] = newSession;

        return newSession;
    }
}