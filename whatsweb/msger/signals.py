from django.dispatch import receiver
from allauth.account.signals import user_signed_up
from .models import UserProfile


@receiver(user_signed_up)
def create_user_profile(sender, request, user, **kwargs):
    UserProfile.objects.create(user=user, display_name=user.username)
