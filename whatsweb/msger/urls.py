from django.urls import path
from .views import *

urlpatterns = [
    path("chats/", ChatListView.as_view(), name="chat-list"),
    path("chats/create/", ChatCreateView.as_view(), name="chat-create"),
    path("chats/<int:pk>/edit/", ChatUpdateView.as_view(), name="chat-edit"),
    path("chats/<int:pk>/delete/", ChatDeleteView.as_view(), name="chat-delete"),

    path("messages/send/", MessageCreateView.as_view(), name="message-send"),
    path("chats/<int:chat_id>/messages/", MessageListView.as_view(), name="message-list"),
    path("messages/<int:pk>/edit/", MessageUpdateView.as_view(), name="message-edit"),
    path("messages/<int:pk>/delete/", MessageDeleteView.as_view(), name="message-delete"),

    path("users/", UserListView.as_view(), name="user-list"),
]
