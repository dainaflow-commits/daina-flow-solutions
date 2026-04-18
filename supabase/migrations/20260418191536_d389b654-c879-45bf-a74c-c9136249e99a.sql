
-- Documentos legais editáveis (LGPD, Termos de Uso, Transparência)
CREATE TABLE public.legal_documents (
  slug text PRIMARY KEY,
  title text NOT NULL,
  content_markdown text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view legal docs"
  ON public.legal_documents FOR SELECT
  USING (true);

CREATE POLICY "Admins manage legal docs"
  ON public.legal_documents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial
INSERT INTO public.legal_documents (slug, title, content_markdown) VALUES
('privacidade', 'Política de Privacidade (LGPD)',
'# Política de Privacidade — LGPD

**Última atualização:** abril de 2026

A Daina Flow respeita a sua privacidade e está comprometida com a proteção dos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

## 1. Quem somos
A Daina Flow é uma consultoria de People Analytics, Governança de Dados e Automação Low-code, conduzida por Larissa Daina, sediada em Igarapé-MG.

## 2. Quais dados coletamos
- **Cadastro:** nome, e-mail, telefone, empresa.
- **Comunicação:** mensagens trocadas via formulário, WhatsApp, e-mail, chat do portal.
- **Projeto:** informações fornecidas voluntariamente para execução do serviço contratado.

## 3. Por que coletamos
- Atender solicitações comerciais e dúvidas.
- Executar contratos e propostas.
- Manter histórico de relacionamento.
- Cumprir obrigações legais e fiscais.

## 4. Compartilhamento
Não vendemos seus dados. Compartilhamos apenas com fornecedores essenciais (e-mail, hospedagem, banco de dados) e quando exigido por lei.

## 5. Seus direitos (LGPD, art. 18)
Você pode a qualquer momento solicitar: confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação, e revogação de consentimento.

## 6. Como exercer seus direitos
Envie e-mail para **larissa@dainaflow.com** — responderemos em até 15 dias úteis.

## 7. Segurança
Aplicamos boas práticas técnicas: criptografia em trânsito (HTTPS), controle de acesso por papéis, e logs de auditoria.

## 8. Retenção
Mantemos os dados pelo tempo necessário para cumprir as finalidades descritas, ou pelo prazo legal aplicável.'),

('termos', 'Termos de Uso',
'# Termos de Uso

**Última atualização:** abril de 2026

Ao acessar este site ou criar uma conta no portal Daina Flow, você concorda com estes Termos.

## 1. Aceitação
O uso dos serviços implica aceitação integral destes Termos e da Política de Privacidade.

## 2. Cadastro
Você se compromete a fornecer informações verdadeiras e a manter a confidencialidade da sua senha. É responsável por toda atividade realizada com sua conta.

## 3. Uso permitido
Você pode usar a plataforma para: acompanhar projetos contratados, trocar mensagens com a equipe, visualizar e assinar propostas e contratos.

## 4. Uso proibido
- Tentar burlar mecanismos de segurança.
- Enviar conteúdo ilegal, ofensivo ou que viole direitos de terceiros.
- Usar a plataforma para spam ou engenharia reversa.

## 5. Propriedade intelectual
Todo o conteúdo do site (textos, identidade visual, código) é de titularidade da Daina Flow, salvo materiais entregues ao cliente como parte de projetos contratados.

## 6. Limitação de responsabilidade
Os serviços são oferecidos "no estado em que se encontram". Não nos responsabilizamos por indisponibilidades pontuais de infraestrutura terceira.

## 7. Encerramento
Podemos suspender contas que violarem estes Termos, mediante aviso prévio sempre que possível.

## 8. Foro
Fica eleito o foro da comarca de Igarapé-MG para dirimir dúvidas.'),

('transparencia', 'Política de Transparência',
'# Política de Transparência

**Última atualização:** abril de 2026

A Daina Flow acredita que clareza gera confiança. Por isso, deixamos público o que fazemos, como cobramos e quais ferramentas usamos.

## 1. Como precificamos
- **Diagnóstico inicial gratuito** (até 30 minutos).
- **Projetos por escopo fechado**, com proposta detalhada antes do início.
- **Hora técnica** apenas para ajustes pontuais fora do escopo.

## 2. Ferramentas e parceiros
- **Hospedagem & banco de dados:** infraestrutura em nuvem com backups automáticos.
- **Envio de e-mails:** Resend.
- **Mensageria:** WhatsApp Business.
- **IA:** modelos via gateway próprio para geração de propostas/contratos.

## 3. Subprocessadores de dados
Listamos quem trata dados em nosso nome para execução do serviço — disponível mediante solicitação.

## 4. Conflitos de interesse
Quando recomendamos uma ferramenta de terceiro, informamos se há comissionamento envolvido.

## 5. Métricas que reportamos
Em todo projeto: horas trabalhadas, marcos entregues, riscos identificados e próximos passos.

## 6. Como falar conosco
Canal aberto pelo portal, WhatsApp e e-mail **larissa@dainaflow.com**.');
