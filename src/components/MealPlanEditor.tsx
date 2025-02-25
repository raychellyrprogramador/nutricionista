import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
  Eye,
  Save,
  Clock,
  Send,
  Users,
  History
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MealPlanEditorProps {
  onSave?: (content: any) => void;
  initialContent?: any;
}

export function MealPlanEditor({ onSave, initialContent }: MealPlanEditorProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nutritionalInfo, setNutritionalInfo] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fats: ''
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image,
      Table,
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  const handleSave = async (isDraft = true) => {
    if (!editor || !title || !category) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const mealPlanData = {
        title,
        category,
        content: editor.getJSON(),
        nutritional_info: nutritionalInfo,
        scheduled_date: scheduledDate ? new Date(scheduledDate) : null,
        scheduled_time: scheduledTime || null,
        selected_groups: selectedGroups,
        status: isDraft ? 'draft' : 'published',
        created_by: user.id,
        created_at: new Date(),
      };

      const { error } = await supabase
        .from('meal_plans')
        .insert(mealPlanData);

      if (error) throw error;

      if (!isDraft) {
        // Enviar notificações aos usuários selecionados
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(selectedGroups.map(groupId => ({
            user_id: groupId,
            type: 'new_meal_plan',
            title: 'Novo Cardápio Disponível',
            content: `Um novo cardápio "${title}" foi publicado.`,
            meal_plan_id: mealPlanData.id
          })));

        if (notificationError) throw notificationError;
      }

      if (onSave) {
        onSave(mealPlanData);
      }
    } catch (error) {
      console.error('Erro ao salvar cardápio:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('meal_plan_images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('meal_plan_images')
        .getPublicUrl(fileName);

      if (editor) {
        editor.chain().focus().setImage({ src: publicUrl }).run();
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Barra de ferramentas principal */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Título do cardápio"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Selecione a categoria</option>
            <option value="breakfast">Café da Manhã</option>
            <option value="lunch">Almoço</option>
            <option value="snack">Lanche</option>
            <option value="dinner">Jantar</option>
          </select>
        </div>

        {/* Informações nutricionais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <input
            type="number"
            placeholder="Calorias"
            value={nutritionalInfo.calories}
            onChange={(e) => setNutritionalInfo(prev => ({ ...prev, calories: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="number"
            placeholder="Proteínas (g)"
            value={nutritionalInfo.protein}
            onChange={(e) => setNutritionalInfo(prev => ({ ...prev, protein: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="number"
            placeholder="Carboidratos (g)"
            value={nutritionalInfo.carbs}
            onChange={(e) => setNutritionalInfo(prev => ({ ...prev, carbs: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="number"
            placeholder="Gorduras (g)"
            value={nutritionalInfo.fats}
            onChange={(e) => setNutritionalInfo(prev => ({ ...prev, fats: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Agendamento */}
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Barra de formatação */}
      <div className="bg-white rounded-lg shadow p-2 flex flex-wrap gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <Bold className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <Italic className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded ${editor.isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <UnderlineIcon className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <AlignLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <AlignCenter className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <AlignRight className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <ListOrdered className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="p-2 rounded hover:bg-gray-100"
        >
          <TableIcon className="w-5 h-5" />
        </button>
        <label className="p-2 rounded hover:bg-gray-100 cursor-pointer">
          <ImageIcon className="w-5 h-5" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
        </label>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-lg shadow p-6 min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      {/* Barra de ações */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Eye className="w-5 h-5" />
            Preview
          </button>
          <button
            onClick={() => handleSave(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Save className="w-5 h-5" />
            Salvar Rascunho
          </button>
        </div>
        <button
          onClick={() => handleSave(false)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          disabled={isSaving}
        >
          <Send className="w-5 h-5" />
          {isSaving ? 'Publicando...' : 'Publicar'}
        </button>
      </div>

      {/* Modal de Preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="prose max-w-none">
              <h1>{title}</h1>
              <div className="flex gap-4 text-sm text-gray-500 mb-4">
                <span>{category}</span>
                <span>•</span>
                <span>{format(new Date(scheduledDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div>
                  <strong>Calorias</strong>
                  <p>{nutritionalInfo.calories} kcal</p>
                </div>
                <div>
                  <strong>Proteínas</strong>
                  <p>{nutritionalInfo.protein}g</p>
                </div>
                <div>
                  <strong>Carboidratos</strong>
                  <p>{nutritionalInfo.carbs}g</p>
                </div>
                <div>
                  <strong>Gorduras</strong>
                  <p>{nutritionalInfo.fats}g</p>
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Fechar Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}