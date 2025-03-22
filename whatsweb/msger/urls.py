from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from .views import *

urlpatterns = [
    path("chats/", ChatListView.as_view(), name="chat-list"),
    path("chats/create/", ChatCreateView.as_view(), name="chat-create"),
    path('chats/<int:pk>/edit/', ChatUpdateView.as_view(), name='chat-edit'),
    path("chats/<int:pk>/delete/", ChatDeleteView.as_view(), name="chat-delete"),

    path("messages/send/", MessageCreateView.as_view(), name="message-send"),
    path("chats/<int:chat_id>/messages/", MessageListView.as_view(), name="message-list"),
    path("messages/<int:pk>/edit/", MessageUpdateView.as_view(), name="message-edit"),
    path("messages/<int:pk>/delete/", MessageDeleteView.as_view(), name="message-delete"),

    path("users/", UserListView.as_view(), name="user-list"),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('current_user/', CurrentUserView.as_view(), name='current_user'),

    path('prof/', ProfileListView.as_view(), name='profile-list'),
    path('prof/<int:pk>/edit', ProfileUpdateView.as_view(), name='profile-edit'),
    path('prof/avatar/', AvatarUpdateView.as_view(), name='update-avatar'),

    path("messenger/", messenger, name='messenger'),
    path('profile/', profile, name='profile')
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)