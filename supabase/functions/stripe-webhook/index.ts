import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
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
    // Verificar variáveis de ambiente
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeSecretKey || !stripeWebhookSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }

    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Inicializar Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar assinatura do webhook
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Obter o body raw
    const body = await req.text()

    // Verificar e construir evento
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Processing event: ${event.type}`)

    // Processar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, supabase, stripe)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpsert(subscription, supabase)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabase)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice, supabase)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice, supabase)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
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

// Handler para checkout completado
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: any,
  stripe: Stripe
) {
  const organizationId = session.metadata?.organization_id

  if (!organizationId) {
    console.error('No organization_id in session metadata')
    return
  }

  if (session.mode === 'subscription' && session.subscription) {
    // Buscar detalhes da subscription
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

    // Atualizar organização
    const { error } = await supabase
      .from('organizations')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
        stripe_customer_id: subscription.customer,
        subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)

    if (error) {
      console.error('Error updating organization after checkout:', error)
    } else {
      console.log(`Organization ${organizationId} subscription activated`)
    }
  }
}

// Handler para subscription criada/atualizada
async function handleSubscriptionUpsert(subscription: Stripe.Subscription, supabase: any) {
  const organizationId = subscription.metadata?.organization_id

  if (!organizationId) {
    // Tentar encontrar pela customer_id
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single()

    if (!org) {
      console.error('No organization found for subscription:', subscription.id)
      return
    }
  }

  // Determinar o plano baseado no price_id
  const priceId = subscription.items.data[0]?.price?.id
  let plan = 'starter'
  let subscriptionPrice = 64.99

  // Mapear price_id para plano (substituir pelos IDs reais do Stripe)
  if (priceId?.includes('professional')) {
    plan = 'professional'
    subscriptionPrice = 149.99
  } else if (priceId?.includes('enterprise')) {
    plan = 'enterprise'
    subscriptionPrice = 399.99
  }

  // Atualizar organização
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      stripe_customer_id: subscription.customer,
      plan,
      subscription_price: subscriptionPrice,
      subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', subscription.customer)

  if (updateError) {
    console.error('Error updating organization subscription:', updateError)
  } else {
    console.log(`Subscription ${subscription.id} updated for organization`)
  }

  // Registrar no histórico
  const { error: historyError } = await supabase
    .from('subscription_history')
    .insert({
      organization_id: organizationId || (await getOrganizationIdByCustomer(subscription.customer, supabase)),
      event_type: subscription.status === 'active' ? 'subscription_activated' : 'subscription_updated',
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      amount: subscription.items.data[0]?.price?.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0,
      currency: subscription.items.data[0]?.price?.currency || 'brl',
      status: 'completed',
      metadata: {
        subscription_status: subscription.status,
        current_period_end: subscription.current_period_end,
      },
    })

  if (historyError) {
    console.error('Error inserting subscription history:', historyError)
  }
}

// Handler para subscription deletada
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  // Atualizar organização
  const { error } = await supabase
    .from('organizations')
    .update({
      stripe_subscription_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating organization after subscription deletion:', error)
  } else {
    console.log(`Subscription ${subscription.id} canceled`)
  }

  // Registrar no histórico
  const orgId = await getOrganizationIdBySubscription(subscription.id, supabase)
  if (orgId) {
    await supabase
      .from('subscription_history')
      .insert({
        organization_id: orgId,
        event_type: 'subscription_canceled',
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: 'completed',
        metadata: {
          canceled_at: subscription.canceled_at,
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
      })
  }
}

// Handler para pagamento bem-sucedido
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  if (!invoice.subscription) return

  const orgId = await getOrganizationIdBySubscription(invoice.subscription as string, supabase)
  if (!orgId) return

  // Registrar no histórico
  await supabase
    .from('subscription_history')
    .insert({
      organization_id: orgId,
      event_type: 'payment_succeeded',
      stripe_subscription_id: invoice.subscription,
      stripe_customer_id: invoice.customer,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: 'completed',
      metadata: {
        invoice_number: invoice.number,
        invoice_pdf: invoice.invoice_pdf,
      },
    })

  console.log(`Payment succeeded for invoice ${invoice.id}`)
}

// Handler para pagamento falhou
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  if (!invoice.subscription) return

  const orgId = await getOrganizationIdBySubscription(invoice.subscription as string, supabase)
  if (!orgId) return

  // Atualizar status da organização
  await supabase
    .from('organizations')
    .update({
      stripe_subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId)

  // Registrar no histórico
  await supabase
    .from('subscription_history')
    .insert({
      organization_id: orgId,
      event_type: 'payment_failed',
      stripe_subscription_id: invoice.subscription,
      stripe_customer_id: invoice.customer,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'failed',
      metadata: {
        invoice_number: invoice.number,
        attempt_count: invoice.attempt_count,
      },
    })

  console.log(`Payment failed for invoice ${invoice.id}`)
}

// Helpers
async function getOrganizationIdByCustomer(customerId: string | Stripe.Customer, supabase: any): Promise<string | null> {
  const customerIdStr = typeof customerId === 'string' ? customerId : customerId.id
  
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerIdStr)
    .single()

  return data?.id || null
}

async function getOrganizationIdBySubscription(subscriptionId: string, supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  return data?.id || null
}
