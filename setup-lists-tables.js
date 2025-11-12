const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function setupTables() {
  console.log('Setting up favorite lists tables...');

  // Note: We need to run these SQL commands in the Supabase dashboard
  // or using the service role key (not the anon key)

  const sqlCommands = `
-- Tabla para las listas de favoritos
CREATE TABLE IF NOT EXISTS favorite_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para los items dentro de cada lista
CREATE TABLE IF NOT EXISTS favorite_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES favorite_lists(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, product_id)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_favorite_lists_user_id ON favorite_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_list_items_list_id ON favorite_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_favorite_list_items_product_id ON favorite_list_items(product_id);

-- RLS (Row Level Security) policies
ALTER TABLE favorite_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_list_items ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver sus propias listas
CREATE POLICY "Users can view their own lists"
  ON favorite_lists FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden crear sus propias listas
CREATE POLICY "Users can create their own lists"
  ON favorite_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Los usuarios pueden actualizar sus propias listas
CREATE POLICY "Users can update their own lists"
  ON favorite_lists FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden eliminar sus propias listas
CREATE POLICY "Users can delete their own lists"
  ON favorite_lists FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden ver items de sus propias listas
CREATE POLICY "Users can view items from their own lists"
  ON favorite_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM favorite_lists
      WHERE favorite_lists.id = favorite_list_items.list_id
      AND favorite_lists.user_id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden agregar items a sus propias listas
CREATE POLICY "Users can add items to their own lists"
  ON favorite_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM favorite_lists
      WHERE favorite_lists.id = favorite_list_items.list_id
      AND favorite_lists.user_id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden eliminar items de sus propias listas
CREATE POLICY "Users can delete items from their own lists"
  ON favorite_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM favorite_lists
      WHERE favorite_lists.id = favorite_list_items.list_id
      AND favorite_lists.user_id = auth.uid()
    )
  );
  `;

  console.log('\n===========================================');
  console.log('INSTRUCCIONES PARA CONFIGURAR LAS TABLAS:');
  console.log('===========================================\n');
  console.log('1. Ve a tu dashboard de Supabase:');
  console.log('   https://app.supabase.com/project/dhfnfdschxhfwrfaoyqa\n');
  console.log('2. Ve a SQL Editor en el menú lateral\n');
  console.log('3. Haz click en "New query"\n');
  console.log('4. Copia y pega el siguiente SQL:\n');
  console.log('-------------------------------------------');
  console.log(sqlCommands);
  console.log('-------------------------------------------\n');
  console.log('5. Haz click en "Run" para ejecutar el SQL\n');
  console.log('6. Verifica que las tablas se crearon correctamente en el menu "Table Editor"\n');
  console.log('===========================================\n');

  // Let's check if tables exist
  try {
    console.log('Verificando si las tablas ya existen...\n');

    const { data: lists, error: listsError } = await supabase
      .from('favorite_lists')
      .select('count');

    const { data: items, error: itemsError } = await supabase
      .from('favorite_list_items')
      .select('count');

    if (!listsError && !itemsError) {
      console.log('✅ Las tablas YA EXISTEN y están listas para usar!\n');
      console.log('No necesitas hacer nada más. Las listas funcionarán correctamente.\n');
    } else {
      console.log('⚠️  Las tablas NO existen aún.');
      console.log('Por favor sigue las instrucciones arriba para crearlas.\n');
      if (listsError) console.log('Error en favorite_lists:', listsError.message);
      if (itemsError) console.log('Error en favorite_list_items:', itemsError.message);
    }
  } catch (error) {
    console.error('Error verificando tablas:', error.message);
  }
}

setupTables();
