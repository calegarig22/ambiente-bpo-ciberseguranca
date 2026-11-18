// Cria (ou redefine a senha de) o usuário Admin, que é o coordenador de GRC.
// Só é preciso uma vez: os coordenadores são criados depois, pela aba Admin.
//
//   npm run criar-admin -- seu@email.com "Seu Nome"
//
// A senha é pedida no terminal, para não ficar no histórico do shell nem em arquivo.
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { createInterface } from 'node:readline/promises'

const url = process.env.DATABASE_URL
const [email, nome] = process.argv.slice(2)

if (!url) {
  console.error('Falta DATABASE_URL no .env.local')
  process.exit(1)
}
if (!email || !nome) {
  console.error('Use: npm run criar-admin -- seu@email.com "Seu Nome"')
  process.exit(1)
}

// Lê a senha sem mostrar o que é digitado (troca cada tecla por nada na tela)
async function perguntarSenha(texto: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  // _writeToOutput é interno do Node: é por ele que o readline mostra o que se digita
  const saida = rl as unknown as { _writeToOutput: (s: string) => void }
  process.stdout.write(texto)
  saida._writeToOutput = () => {}
  const resposta = await rl.question('')
  rl.close()
  process.stdout.write('\n')
  return resposta
}

const senha = await perguntarSenha('Senha do Admin (mínimo 8 caracteres): ')
if (senha.length < 8) {
  console.error('Senha curta demais.')
  process.exit(1)
}

// Custo 12: lento o bastante para atrapalhar quem tentar adivinhar senhas
const hash = await bcrypt.hash(senha, 12)
const sql = neon(url)

// Se o e-mail já existir, vira Admin ativo com a nova senha
const linhas = await sql`
  insert into usuarios (email, nome, senha_hash, papel, area)
  values (${email.trim().toLowerCase()}, ${nome.trim()}, ${hash}, 'admin', 'GRC')
  on conflict (email) do update
    set nome = excluded.nome, senha_hash = excluded.senha_hash,
        papel = 'admin', area = 'GRC', ativo = true
  returning email
`
console.log('Admin pronto:', linhas[0].email)
