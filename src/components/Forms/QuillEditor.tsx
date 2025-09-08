'use client';

import { useEffect, useRef } from 'react';
import 'quill/dist/quill.snow.css';
import Quill from 'quill';

interface QuillEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    height?: string;
}

export default function QuillEditor({
    value,
    onChange,
    placeholder = 'Écrivez ici...',
    height = '200px'
}: QuillEditorProps) {

    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        const editor = document.createElement('div');
        editorRef.current.innerHTML = '';
        editorRef.current.appendChild(editor);

        const quill = new Quill(editor, {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'size': ['small', false, 'large'] }],
                    [{ 'align': [] }],
                    ['clean']
                ],
            },
            placeholder: placeholder,
        });

        quill.root.innerHTML = value;
        quillRef.current = quill;

        quill.on('text-change', () => {
            onChange(quill.root.innerHTML);
        });

        return () => {
            quillRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (quillRef.current && quillRef.current.root.innerHTML !== value) {
            quillRef.current.root.innerHTML = value;
        }
    }, [value]);

    return (
        <div
            ref={editorRef}
            style={{ height }}
            className="bg-white rounded-xl"
        />
    );
}