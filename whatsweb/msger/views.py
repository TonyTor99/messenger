from django.contrib.auth.models import User
from django.shortcuts import render
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Chat, Message
from .serializers import ChatSerializers, MessageSerializers, UserSerializers


def messenger(request):
    return render(request, 'messenger.html')


class ChatCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        chat_name = data.get('name', 'Чат')
        is_group = data.get('is_group', False)
        user_ids = data.get('users', [])  # Получаем список участников

        if not user_ids:
            return Response({"error": "Необходимо указать хотя бы одного участника"}, status=400)

        # Для группового чата нужно добавить всех участников
        if is_group:
            users = User.objects.filter(id__in=user_ids)  # Получаем всех пользователей по списку ID
        else:
            # Для личного чата проверяем наличие второго участника
            if len(user_ids) != 1:
                return Response({"error": "Для личного чата необходимо указать только одного участника"}, status=400)
            users = [User.objects.get(id=user_ids[0])]  # Получаем одного участника

        # Проверяем, существует ли уже такой чат
        if not is_group:
            existing_chat = Chat.objects.filter(
                participants=request.user
            ).filter(
                participants__id__in=user_ids
            ).filter(
                is_group=False
            ).first()

            if existing_chat:
                return Response(ChatSerializers(existing_chat).data)

        # Создаем новый чат
        chat = Chat.objects.create(is_group=is_group, name=chat_name)

        # Добавляем участников
        chat.participants.add(request.user, *users)

        # Для группового чата добавляем администратора (создателя)
        if is_group:
            chat.admins.add(request.user)
        else:
            chat.admins.add(request.user, *users)

        return Response(ChatSerializers(chat).data, status=201)


class ChatListView(generics.ListAPIView):
    serializer_class = ChatSerializers
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Chat.objects.filter(participants=self.request.user)


class ChatUpdateView(generics.UpdateAPIView):
    queryset = Chat.objects.all()
    serializer_class = ChatSerializers
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        chat_id = self.request.data.get("chat_id")
        chat = generics.get_object_or_404(Chat, id=chat_id)

        if self.request.user not in chat.participants.all():
            raise PermissionDenied("Вы не можете редактировать этот чат!")

        return chat


class ChatDeleteView(generics.DestroyAPIView):
    queryset = Chat.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def perform_destroy(self, instance):
        user = self.request.user
        if user in instance.admins.all():
            instance.delete()
        else:
            raise PermissionDenied('Вы не администратор этого чата!')


class MessageCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        chat_id = data.get('chat_id')
        sender = self.request.user
        text = data.get('text')

        if not chat_id:
            return Response({"error": "Необходимо указать ID чата"}, status=400)
        if not text:
            return Response({"error": "Необходимо написать текст сообщения"}, status=400)

        try:
            chat = Chat.objects.get(id=chat_id)
        except Chat.DoesNotExist:
            return Response({"error": "Чат не найден"}, status=404)

        if sender not in chat.participants.all():
            return Response({"error": "Вы не состоите в этом чате"}, status=400)

        msg = Message.objects.create(
            text=text,
            chat=chat,
            sender=sender
        )

        return Response(MessageSerializers(msg).data, status=201)


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializers
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        chat_id = self.kwargs['chat_id']
        chat = Chat.objects.get(id=chat_id)

        if self.request.user not in chat.participants.all():
            raise PermissionDenied("Вы не участник этого чата!")

        return chat.messages.filter(is_deleted=False).order_by('-created_at')


class MessageUpdateView(generics.UpdateAPIView):
    queryset = Message.objects.all()
    serializer_class = MessageSerializers
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        message = self.get_object()
        user = self.request.user

        if user == message.sender:
            serializer.save(edited_at=timezone.now())
        else:
            raise PermissionDenied("Вы не можете редактировать это сообщение!")


class MessageDeleteView(generics.UpdateAPIView):
    queryset = Message.objects.all()
    serializer_class = MessageSerializers
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        message = self.get_object()
        user = self.request.user

        if user == message.sender:
            serializer.save(is_delete=True)
        else:
            raise PermissionDenied("Вы не можете удалить это сообщение!")


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializers
    permission_classes = [permissions.IsAuthenticated]


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'user_id': user.id,
            'username': user.username
        })
