from .models import *
from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializers(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class UserProfileSerializers(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['user', 'avatar']


class MessageSerializers(serializers.ModelSerializer):
    chat_id = serializers.PrimaryKeyRelatedField(queryset=Chat.objects.all())
    sender = UserSerializers(read_only=True)
    text = serializers.CharField(required=True)
    created_at = serializers.DateTimeField(read_only=True)
    edited_at = serializers.DateTimeField(required=False, allow_null=True)
    is_deleted = serializers.BooleanField(default=False, required=False)

    class Meta:
        model = Message
        fields = ['id', 'chat_id', 'sender', 'text', 'created_at', 'edited_at', 'is_deleted']


class ChatSerializers(serializers.HyperlinkedModelSerializer):
    participants = UserSerializers(many=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ['id', 'name', 'is_group', 'participants', 'last_message']

    def get_last_message(self, obj):
        last_msg = obj.messages.filter(is_deleted=False).order_by('-created_at').first()
        return MessageSerializers(last_msg).data if last_msg else None
