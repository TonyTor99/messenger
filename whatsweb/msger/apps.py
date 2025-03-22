from django.apps import AppConfig


class MsgerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'msger'

    def ready(self):
        import msger.signals
