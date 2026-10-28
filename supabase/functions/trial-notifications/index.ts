import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY') // ou outro serviço de email

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar organizações com trial expirando ou expirado
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000))
    const oneDayFromNow = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000))

    // Trials expirando em 3 dias
    const { data: expiring3Days, error: error3 } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        trial_ends_at,
        billing_email,
        organization_members!inner(
          user_id,
          role,
          profiles!inner(
            email,
            nome
          )
        )
      `)
      .eq('stripe_subscription_status', 'trialing')
      .gte('trial_ends_at', now.toISOString())
      .lte('trial_ends_at', threeDaysFromNow.toISOString())

    if (error3) {
      console.error('Error fetching expiring trials (3 days):', error3)
    } else {
      console.log(`Found ${expiring3Days?.length || 0} trials expiring in 3 days`)
      for (const org of expiring3Days || []) {
        await sendTrialExpiringEmail(org, 3, resendApiKey)
      }
    }

    // Trials expirando em 1 dia
    const { data: expiring1Day, error: error1 } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        trial_ends_at,
        billing_email,
        organization_members!inner(
          user_id,
          role,
          profiles!inner(
            email,
            nome
          )
        )
      `)
      .eq('stripe_subscription_status', 'trialing')
      .gte('trial_ends_at', now.toISOString())
      .lte('trial_ends_at', oneDayFromNow.toISOString())

    if (error1) {
      console.error('Error fetching expiring trials (1 day):', error1)
    } else {
      console.log(`Found ${expiring1Day?.length || 0} trials expiring in 1 day`)
      for (const org of expiring1Day || []) {
        await sendTrialExpiringEmail(org, 1, resendApiKey)
      }
    }

    // Trials expirados hoje
    const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000))
    const { data: expired, error: errorExp } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        trial_ends_at,
        billing_email,
        organization_members!inner(
          user_id,
          role,
          profiles!inner(
            email,
            nome
          )
        )
      `)
      .eq('stripe_subscription_status', 'trialing')
      .gte('trial_ends_at', yesterday.toISOString())
      .lte('trial_ends_at', now.toISOString())

    if (errorExp) {
      console.error('Error fetching expired trials:', errorExp)
    } else {
      console.log(`Found ${expired?.length || 0} expired trials`)
      for (const org of expired || []) {
        await sendTrialExpiredEmail(org, resendApiKey)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        expiring3Days: expiring3Days?.length || 0,
        expiring1Day: expiring1Day?.length || 0,
        expired: expired?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in trial notifications:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function sendTrialExpiringEmail(org: any, daysRemaining: number, apiKey?: string) {
  if (!apiKey) {
    console.log(`[DRY RUN] Would send trial expiring email (${daysRemaining} days) to organization:`, org.name)
    return
  }

  // Pegar email do owner
  const owner = org.organization_members?.find((m: any) => m.role === 'owner')
  const email = owner?.profiles?.email || org.billing_email

  if (!email) {
    console.error('No email found for organization:', org.id)
    return
  }

  const subject = `⏰ Faltam ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} para seu trial expirar - Lumina ERP`
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .cta { text-align: center; margin: 30px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Seu trial está acabando!</h1>
        </div>
        <div class="content">
          <p>Olá ${owner?.profiles?.nome || 'Usuário'},</p>
          
          <p><strong>Faltam apenas ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}</strong> para o período de teste da sua conta <strong>${org.name}</strong> expirar!</p>
          
          <p>Você teve a oportunidade de testar o Lumina ERP gratuitamente por 14 dias. Para continuar aproveitando todos os recursos e manter seus dados seguros, escolha um plano agora.</p>
          
          <div class="cta">
            <a href="https://luminaerp.com/upgrade" class="button">
              🚀 Fazer Upgrade Agora
            </a>
          </div>
          
          <h3>Por que fazer upgrade?</h3>
          <ul>
            <li>✅ Mantenha acesso a todos os seus dados</li>
            <li>✅ Suporte prioritário</li>
            <li>✅ Backup automático diário</li>
            <li>✅ Relatórios avançados e análises</li>
            <li>✅ Integrações ilimitadas</li>
          </ul>
          
          <p><strong>Planos a partir de R$ 64,99/mês</strong></p>
          
          <p>Dúvidas? Responda este email ou visite nossa <a href="https://luminaerp.com/faq">Central de Ajuda</a>.</p>
          
          <p>Até breve,<br><strong>Equipe Lumina ERP</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Lumina ERP. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Lumina ERP <noreply@luminaerp.com>',
        to: email,
        subject,
        html
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`)
    }

    console.log(`Trial expiring email sent to ${email} for organization ${org.name}`)
  } catch (error) {
    console.error('Error sending trial expiring email:', error)
  }
}

async function sendTrialExpiredEmail(org: any, apiKey?: string) {
  if (!apiKey) {
    console.log('[DRY RUN] Would send trial expired email to organization:', org.name)
    return
  }

  const owner = org.organization_members?.find((m: any) => m.role === 'owner')
  const email = owner?.profiles?.email || org.billing_email

  if (!email) {
    console.error('No email found for organization:', org.id)
    return
  }

  const subject = '🎉 Seu trial expirou - Continue com Lumina ERP!'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .cta { text-align: center; margin: 30px 0; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Obrigado por testar o Lumina ERP!</h1>
        </div>
        <div class="content">
          <p>Olá ${owner?.profiles?.nome || 'Usuário'},</p>
          
          <p>Seu período de teste de 14 dias da conta <strong>${org.name}</strong> acabou!</p>
          
          <p><strong>Não perca seus dados e todo o trabalho que você fez.</strong> Faça upgrade agora para continuar usando o Lumina ERP sem interrupções.</p>
          
          <div class="cta">
            <a href="https://luminaerp.com/upgrade" class="button">
              🚀 Fazer Upgrade e Continuar
            </a>
          </div>
          
          <h3>O que você perde sem fazer upgrade:</h3>
          <ul>
            <li>❌ Acesso a todos os seus projetos e clientes</li>
            <li>❌ Histórico completo de transações</li>
            <li>❌ Relatórios e análises de negócio</li>
            <li>❌ Integrações com calendário e outras ferramentas</li>
            <li>❌ Backup automático dos seus dados</li>
          </ul>
          
          <p><strong>Escolha o plano ideal:</strong></p>
          <ul>
            <li><strong>Starter:</strong> R$ 64,99/mês - Até 5 usuários</li>
            <li><strong>Professional:</strong> R$ 149,99/mês - Até 20 usuários + IA</li>
            <li><strong>Enterprise:</strong> R$ 399,99/mês - Ilimitado + suporte 24/7</li>
          </ul>
          
          <p>Precisa de ajuda para decidir? Entre em contato conosco!</p>
          
          <p>Atenciosamente,<br><strong>Equipe Lumina ERP</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Lumina ERP. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Lumina ERP <noreply@luminaerp.com>',
        to: email,
        subject,
        html
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`)
    }

    console.log(`Trial expired email sent to ${email} for organization ${org.name}`)
  } catch (error) {
    console.error('Error sending trial expired email:', error)
  }
}
