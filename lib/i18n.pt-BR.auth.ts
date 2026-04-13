import type { Dictionary } from "./i18n.en.ts";

export const ptBRAuthDictionary: Pick<Dictionary, 'login' | 'register' | 'forgotPassword' | 'resetPassword'> = {
login: {
  title: "Entrar",
  description:
    "Entre com sua conta existente para gerenciar conexoes do Instagram, geracao de conteudo e publicacoes.",
  email: "Email",
  password: "Senha",
  forgotPassword: "Esqueceu sua senha?",
  createAccount: "Criar conta",
  emailPlaceholder: "revisor@exemplo.com",
  passwordPlaceholder: "minimo de 8 caracteres",
  submit: "Entrar",
  submitting: "Entrando...",
  continueError: "Nao foi possivel continuar."
},

register: {
  title: "Criar Conta",
  description:
    "Crie sua conta com uma senha segura para que cada usuario tenha seu proprio espaco protegido.",
  email: "Email",
  password: "Senha",
  confirmPassword: "Confirmar senha",
  emailPlaceholder: "revisor@exemplo.com",
  passwordPlaceholder: "minimo de 8 caracteres",
  confirmPasswordPlaceholder: "Repita sua senha",
  submit: "Criar conta",
  submitting: "Criando conta...",
  loginLink: "Ja tem conta? Entrar",
  passwordMismatch: "As senhas nao coincidem.",
  continueError: "Nao foi possivel criar sua conta."
},

forgotPassword: {
  title: "Redefinir Senha",
  description:
    "Informe seu email e vamos gerar um link seguro de redefinicao caso a conta exista.",
  email: "Email",
  emailPlaceholder: "revisor@exemplo.com",
  submit: "Enviar link de redefinicao",
  submitting: "Enviando link...",
  success:
    "Se este email existir, um link de redefinicao foi gerado. Em desenvolvimento, o link pode aparecer abaixo.",
  loginLink: "Voltar para o login",
  continueError: "Nao foi possivel solicitar a redefinicao de senha.",
  devLinkLabel: "Link de redefinicao em desenvolvimento"
},

resetPassword: {
  title: "Escolher Nova Senha",
  description:
    "Crie uma nova senha para recuperar o acesso a sua conta. As sessoes antigas serao encerradas.",
  password: "Nova senha",
  confirmPassword: "Confirmar nova senha",
  passwordPlaceholder: "minimo de 8 caracteres",
  confirmPasswordPlaceholder: "Repita sua nova senha",
  submit: "Salvar nova senha",
  submitting: "Salvando senha...",
  success: "Senha atualizada com sucesso. Redirecionando para o dashboard...",
  invalidToken: "Este link de redefinicao esta ausente ou e invalido.",
  loginLink: "Voltar para o login",
  passwordMismatch: "As senhas nao coincidem.",
  continueError: "Nao foi possivel redefinir a senha."
},
};
