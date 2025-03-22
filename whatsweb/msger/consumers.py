import json

from channels.auth import get_user
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import Chat, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = await get_user(self.scope)
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.room_group_name = f'chat_{self.chat_id}'

        print(f"Запрашиваем чат с id: {self.chat_id}")

        # Подключение к группе чата
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Разрешить подключение
        await self.accept()

        # Отправка всех сообщений чата клиенту
        await self.send_chat_history()

    async def disconnect(self, close_code):
        # Отключение от группы чата
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        user = self.scope['user']
        room = await self.get_room(self.chat_id)

        message = await self.save_message(user, room, text_data_json['message'])

        # Отправка сообщения в группу
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message.text,
                'username': user.username,
                'user_id': user.id
            }
        )

    async def chat_message(self, event):
        # Отправка сообщения обратно на клиент
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'username': event['username'],
            'user_id': event['user_id']
        }))

    @database_sync_to_async
    def get_room(self, chat_id):
        return Chat.objects.get(id=chat_id)

    @staticmethod
    async def save_message(user, room, message):
        """Сохранение нового сообщения в БД"""
        return await Message.objects.acreate(sender=user, chat=room, text=message)

    @database_sync_to_async
    def get_chat_history(self):
        """Получение всех сообщений текущего чата"""
        messages = Message.objects.filter(chat_id=self.chat_id).order_by('created_at')
        return [
            {
                'username': msg.sender.username,
                'user_id': msg.sender.id,
                'message': msg.text,
            }
            for msg in messages
        ]

    async def send_chat_history(self):
        """Отправка всех сообщений клиенту при подключении"""
        chat_history = await self.get_chat_history()

        await self.send(text_data=json.dumps({
            'type': 'chat_history',
            'messages': chat_history
        }))
