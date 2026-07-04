import os

filepath = 'server/src/services/communication.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Replace sendOrderEmail error classification
old_email_error = """  } catch (error: any) {
    // Intelligent failure classification
    let reason = "Unknown SMTP Error";
    if (error.code === 'ECONNECTION') reason = "Network Connection Error";
    if (error.responseCode >= 500) reason = "SMTP Server Error";
    if (error.responseCode >= 400 && error.responseCode < 500) reason = "SMTP Auth/Client Error";
    console.error('Failed to send order email:', error);
    throw new Error(reason);
  }"""

new_email_error = """  } catch (error: any) {
    let reason = "UNKNOWN_ERROR";
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') reason = "NETWORK_ERROR";
    else if (error.responseCode >= 500) reason = "PROVIDER_ERROR";
    else if (error.responseCode >= 400 && error.responseCode < 500) reason = "AUTHENTICATION_ERROR";

    console.error('Failed to send order email:', error);
    throw new Error(reason);
  }"""
content = content.replace(old_email_error, new_email_error)

# Replace sendWhatsAppMessage error classification and remove production mock failures
old_wa_logic = """export const sendWhatsAppMessage = async (order: any) => {
  try {
    if (!order.phone) return false;
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate a failure for observability testing randomly 5% of time
    if (Math.random() < 0.05) {
        throw new Error("WhatsApp API Timeout");
    }

    console.log(`[SIMULATED] WhatsApp sent to ${order.phone} for order ${order.orderNumber}`);
    return true;
  } catch (error: any) {
    console.error('Failed to send WhatsApp message:', error);
    throw new Error(error.message || "WhatsApp Provider API Error");
  }
};"""

new_wa_logic = """export const sendWhatsAppMessage = async (order: any) => {
  try {
    if (!order.phone) return false;

    // In a real integration, replace this with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));

    if (process.env.NODE_ENV === "development" && Math.random() < 0.05) {
        throw new Error("TIMEOUT");
    }

    console.log(`[SIMULATED] WhatsApp sent to ${order.phone} for order ${order.orderNumber}`);
    return true;
  } catch (error: any) {
    let reason = "UNKNOWN_ERROR";
    if (error.message === 'TIMEOUT') reason = "TIMEOUT";
    else if (error.message.includes('Auth')) reason = "AUTHENTICATION_ERROR";
    else if (error.message.includes('Network')) reason = "NETWORK_ERROR";

    console.error('Failed to send WhatsApp message:', error);
    throw new Error(reason);
  }
};"""
content = content.replace(old_wa_logic, new_wa_logic)

with open(filepath, 'w') as f:
    f.write(content)
