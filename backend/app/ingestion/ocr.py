import io
import logging
from typing import Tuple, List, Dict, Any
from PIL import Image
import pytesseract
from app.config import settings

logger = logging.getLogger("investigator.ocr")

def perform_ocr_on_image(image_bytes: bytes) -> Tuple[str, List[Dict[str, Any]], float]:
    """
    Performs OCR on image bytes using pytesseract (languages configured in settings).
    Returns (extracted_text, bounding_boxes, confidence_score_0_to_1).
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        
        # Get detailed OCR data including bounding boxes and confidence
        data = pytesseract.image_to_data(
            img,
            lang=settings.OCR_LANGS,
            output_type=pytesseract.Output.DICT
        )
        
        lines_text = []
        bboxes = []
        confidences = []
        
        n_boxes = len(data["level"])
        current_line_words = []
        
        for i in range(n_boxes):
            text = data["text"][i].strip()
            conf = float(data["conf"][i])
            if text:
                if conf > 0:
                    confidences.append(conf)
                current_line_words.append(text)
                
                # Normalize bounding box coords (x0, y0, x1, y1)
                x = data["left"][i]
                y = data["top"][i]
                w = data["width"][i]
                h = data["height"][i]
                bboxes.append({
                    "text": text,
                    "box": [round(x, 1), round(y, 1), round(x + w, 1), round(y + h, 1)],
                    "norm_box": [round(x / width, 4), round(y / height, 4), round((x + w) / width, 4), round((y + h) / height, 4)],
                    "conf": conf
                })
        
        full_text = pytesseract.image_to_string(img, lang=settings.OCR_LANGS).strip()
        
        # Calculate mean confidence (0.0 to 1.0)
        mean_conf = (sum(confidences) / len(confidences) / 100.0) if confidences else 0.5
        # Clamp
        mean_conf = max(0.1, min(1.0, mean_conf))
        
        return full_text, bboxes, mean_conf
        
    except Exception as e:
        logger.error(f"OCR execution failed: {e}")
        return "", [], 0.0
