from rest_framework.generics import ListAPIView, RetrieveAPIView

from .models import Color
from .palette import ensure_required_colors
from .serializers import ColorSerializer


class ColorListAPIView(ListAPIView):
    serializer_class = ColorSerializer

    def get_queryset(self):
        # Keep Green in the palette even if an Excel import dropped unused colors.
        ensure_required_colors()
        return Color.objects.all()


class ColorRetrieveAPIView(RetrieveAPIView):
    queryset = Color.objects.all()
    serializer_class = ColorSerializer
