import * as React from "react";

import { cn } from "@/lib/utils/index";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Объединяем refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Автоматическое изменение размера
    React.useEffect(() => {
      if (!autoResize || !textareaRef.current) return;

      const textarea = textareaRef.current;

      const adjustHeight = () => {
        // Сбрасываем высоту, чтобы получить правильный scrollHeight
        textarea.style.height = "auto";
        // Устанавливаем новую высоту на основе содержимого
        // Ограничиваем максимальную высоту до 200px для удобства
        const maxHeight = 200;
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
        // Если контент больше maxHeight, показываем скролл
        textarea.style.overflowY =
          textarea.scrollHeight > maxHeight ? "auto" : "hidden";
      };

      // Начальная установка высоты
      adjustHeight();

      // Обновляем при изменении значения
      textarea.addEventListener("input", adjustHeight);

      // Также обновляем при изменении значения через props
      if (props.value !== undefined) {
        adjustHeight();
      }

      return () => {
        textarea.removeEventListener("input", adjustHeight);
      };
    }, [autoResize, props.value]);

    return (
      <textarea
        ref={textareaRef}
        data-slot="textarea"
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          autoResize && "resize-none overflow-hidden",
          !autoResize && "resize-y",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
