from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(User, related_name="users", on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    display_name = models.CharField(max_length=40, blank=True)

    def __str__(self):
        return self.user.username


class Chat(models.Model):
    name = models.CharField(max_length=255)
    participants = models.ManyToManyField(User, related_name="chats")
    admins = models.ManyToManyField(User, related_name="admin_chats", blank=True)
    is_group = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name if self.is_group else f'Личный чат {self.id}'


class Message(models.Model):
    chat = models.ForeignKey(Chat, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE)
    text = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to="chat_files/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender.username}: {self.text[:30]}..."
