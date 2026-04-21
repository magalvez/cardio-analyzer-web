"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Link as LinkIcon,
  Undo,
  Redo,
  Heading1,
  Heading2
} from "lucide-react";

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200  bg-slate-50/50  backdrop-blur-sm sticky top-0 z-10">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive("bold") ? "bg-blue-600 text-white" : "hover:bg-slate-200 "}`}
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive("italic") ? "bg-blue-600 text-white" : "hover:bg-slate-200 "}`}
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive("underline") ? "bg-blue-600 text-white" : "hover:bg-slate-200 "}`}
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      
      <div className="w-px h-8 bg-slate-200  mx-1" />
      
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive("heading", { level: 1 }) ? "bg-blue-600 text-white" : "hover:bg-slate-200 "}`}
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive("heading", { level: 2 }) ? "bg-blue-600 text-white" : "hover:bg-slate-200 "}`}
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px h-8 bg-slate-200  mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive("bulletList") ? "bg-blue-600 text-white" : "hover:bg-slate-200 "}`}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive("orderedList") ? "bg-blue-600 text-white" : "hover:bg-slate-200 "}`}
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      <button
        onClick={() => editor.chain().focus().undo().run()}
        className="p-2 rounded-lg hover:bg-slate-200  transition-all"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        className="p-2 rounded-lg hover:bg-slate-200  transition-all"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function ReportEditor({ content, onChange }: { content: string, onChange: (html: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-slate  max-w-none focus:outline-none min-h-[500px] p-8",
      },
    },
  });

  return (
    <div className="border border-slate-200  rounded-3xl overflow-hidden bg-white  shadow-sm focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
