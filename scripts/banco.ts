// Aplica as migrações (db/migrations) ou o seed (db/seed.sql) no banco Neon.
//
//   npm run db:migrar   aplica só as migrações que ainda não rodaram
//   npm run db:seed     insere os 71 itens do protótipo (pode rodar de novo sem duplicar)
//
// Usa o Pool (conexão por WebSocket) porque os arquivos têm vários comandos
// SQL seguidos, e o modo HTTP do Neon só aceita um comando por vez.
import { Pool } from '@neondatabase/serverless'
import { readdirSync, readFileSync } from 'node:fs'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL no .env.local')
  process.exit(1)
}

const pool = new Pool({ connectionString: url })

async function migrar() {
  // Tabela que lembra quais migrações já foram aplicadas
  await pool.query(
    'create table if not exists _migracoes (nome text primary key, aplicada_em timestamptz not null default now())',
  )
  const { rows } = await pool.query('select nome from _migracoes')
  const feitas = new Set(rows.map((r) => r.nome as string))

  // Os arquivos começam com número (001_, 002_...), então a ordem alfabética é a ordem certa
  const arquivos = readdirSync('db/migrations').filter((a) => a.endsWith('.sql')).sort()

  for (const arquivo of arquivos) {
    if (feitas.has(arquivo)) continue
    console.log('Aplicando', arquivo)
    const sql = readFileSync(`db/migrations/${arquivo}`, 'utf8')
    // Transação: se algo falhar no meio, nada da migração fica pela metade
    await pool.query('begin')
    try {
      await pool.query(sql)
      await pool.query('insert into _migracoes (nome) values ($1)', [arquivo])
      await pool.query('commit')
    } catch (erro) {
      await pool.query('rollback')
      throw erro
    }
  }
  console.log('Migrações em dia.')
}

async function seed() {
  await pool.query(readFileSync('db/seed.sql', 'utf8'))
  const { rows } = await pool.query('select area, count(*)::int as n from itens group by area order by area')
  console.log('Itens por área:', rows.map((r) => `${r.area} ${r.n}`).join(', '))
}

const comando = process.argv[2]
try {
  if (comando === 'migrar') await migrar()
  else if (comando === 'seed') await seed()
  else console.error('Use: node scripts/banco.ts migrar | seed')
} finally {
  await pool.end()
}
