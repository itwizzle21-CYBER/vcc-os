import {
  memo,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type TextareaHTMLAttributes,
} from "react";

type BufferedTextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "onBlur" | "onFocus"> & {
  value: string;
  onValueChange: (value: string) => void;
  delay?: number;
  onValueBlur?: (value: string, event: FocusEvent<HTMLTextAreaElement>) => void;
  onValueFocus?: (value: string, event: FocusEvent<HTMLTextAreaElement>) => void;
};

function BufferedTextArea({
  value,
  onValueChange,
  delay = 160,
  onValueBlur,
  onValueFocus,
  ...textareaProps
}: BufferedTextAreaProps) {
  const [draft, setDraft] = useState(value);
  const focusedRef = useRef(false);
  const valueRef = useRef(value);
  const lastSentRef = useRef(value);
  const changeRef = useRef(onValueChange);
  const blurRef = useRef(onValueBlur);
  const focusRef = useRef(onValueFocus);

  useEffect(() => {
    changeRef.current = onValueChange;
    blurRef.current = onValueBlur;
    focusRef.current = onValueFocus;
  }, [onValueBlur, onValueChange, onValueFocus]);

  valueRef.current = value;

  useEffect(() => {
    if (!focusedRef.current || value !== lastSentRef.current) {
      lastSentRef.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    if (draft === value || draft === lastSentRef.current) return;
    const timer = window.setTimeout(() => {
      lastSentRef.current = draft;
      changeRef.current(draft);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [delay, draft, value]);

  function flush(nextValue: string) {
    if (nextValue === lastSentRef.current) return;
    lastSentRef.current = nextValue;
    changeRef.current(nextValue);
  }

  return (
    <textarea
      {...textareaProps}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={(event) => {
        focusedRef.current = true;
        focusRef.current?.(draft, event);
      }}
      onBlur={(event) => {
        focusedRef.current = false;
        flush(draft);
        blurRef.current?.(draft, event);
        window.setTimeout(() => {
          if (focusedRef.current) return;
          lastSentRef.current = valueRef.current;
          setDraft(valueRef.current);
        }, 0);
      }}
    />
  );
}

export default memo(BufferedTextArea);
