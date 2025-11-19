import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Button,
  Img,
  Link,
  Font
} from "@react-email/components";

interface EmailProps {
  passcode?: string;
  userEmail?: string;
  expirationTime?: string;
  resetUrl?: string;
}

export function Email({ 
  passcode = "123456", 
  userEmail = "user@example.com",
  expirationTime = "15 minutes",
  resetUrl = "https://new-era-club.vercel.app/login"
}: EmailProps) {
  const formattedExpiration = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString();

  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily={["Segoe UI", "Arial", "sans-serif"]}
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
            format: "woff2",
          }}
        />
        <title>NEW ERA - Password Reset Code</title>
      </Head>
      <Body style={{
        margin: 0,
        padding: 0,
        backgroundColor: "#f3f4f6",
        fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
      }}>
        <Container style={{
          maxWidth: "520px",
          margin: "40px auto",
          background: "linear-gradient(135deg, #3B06CD 0%, #7C3AED 35%, #F66753 70%, #FA8F3D 100%)",
          borderRadius: "18px",
          color: "#ffffff",
          boxShadow: "0 12px 40px rgba(250, 143, 61, 0.3)",
          overflow: "hidden"
        }}>
          <Section style={{ padding: "40px 30px" }}>
            
            {/* Logo Section */}
            <Section style={{ 
              textAlign: "center", 
              marginBottom: "28px" 
            }}>
              <Link 
                href="https://new-era-club.vercel.app/" 
                target="_blank" 
                style={{ textDecoration: "none", display: "inline-block" }}
              >
                <div style={{
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "20px",
                  padding: "24px 28px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
                  display: "inline-block"
                }}>
                  <Img 
                    src="https://i.ibb.co/qMGc4kvP/Group-11.png" 
                    alt="NEW ERA Logo" 
                    height="78"
                    style={{ display: "block" }}
                  />
                </div>
              </Link>
            </Section>

            {/* Header */}
            <Section style={{ 
              textAlign: "center", 
              marginBottom: "28px" 
            }}>
              <Text style={{ 
                fontSize: "38px", 
                marginBottom: "10px",
                margin: "0 0 10px 0"
              }}>
                🔐
              </Text>
              <Heading style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "#ffffff",
                margin: "0",
                lineHeight: "1.3"
              }}>
                Password Reset Request
              </Heading>
              <Text style={{
                fontSize: "15px",
                color: "rgba(255,255,255,0.9)",
                margin: "6px 0 0",
                lineHeight: "1.4"
              }}>
                Secure access to your NEW ERA account
              </Text>
            </Section>

            {/* OTP Card */}
            <Section style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "28px",
              marginBottom: "20px"
            }}>
              <Text style={{
                fontSize: "16px",
                margin: "0 0 20px",
                color: "rgba(255,255,255,0.95)",
                lineHeight: "1.6",
                textAlign: "center"
              }}>
                Hi there! 👋<br />
                You requested a password reset for: <strong>{userEmail}</strong><br /><br />
                Use this <strong>One-Time Password</strong> to reset your password:
              </Text>
              
              <div style={{
                background: "linear-gradient(135deg, rgba(250,143,61,0.25), rgba(246,103,83,0.25))",
                padding: "20px",
                borderRadius: "10px",
                margin: "0 auto 20px",
                maxWidth: "260px",
                border: "2px solid rgba(250,143,61,0.5)",
                boxShadow: "0 4px 20px rgba(250,143,61,0.25)",
                textAlign: "center"
              }}>
                <Text style={{
                  fontSize: "40px",
                  fontWeight: "800",
                  letterSpacing: "8px",
                  margin: "0",
                  color: "#ffffff",
                  textShadow: "0 0 12px rgba(250,143,61,0.6)",
                  fontFamily: "monospace"
                }}>
                  {passcode}
                </Text>
              </div>
              
              <Text style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.9)",
                margin: "0",
                textAlign: "center"
              }}>
                ⏰ Valid for 15 minutes — Expires at <strong>{formattedExpiration}</strong>
              </Text>
            </Section>

            {/* Reset Button */}
            <Section style={{ textAlign: "center", marginBottom: "20px" }}>
              <Button
                href={resetUrl}
                style={{
                  backgroundColor: "#FA8F3D",
                  color: "#ffffff",
                  padding: "14px 28px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "16px",
                  display: "inline-block",
                  border: "none",
                  boxShadow: "0 4px 16px rgba(250, 143, 61, 0.4)"
                }}
              >
                🔑 Reset My Password
              </Button>
            </Section>

            {/* Security Info */}
            <Section style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              padding: "18px",
              margin: "32px 0 24px"
            }}>
              <Text style={{
                fontSize: "14px",
                color: "#ffffff",
                lineHeight: "1.7",
                margin: "0"
              }}>
                ⚠️ <strong>Security Alert:</strong> Never share this code with anyone, including NEW ERA staff.
                <br /><br />
                If you didn't request this password reset, simply ignore this message. Your password will remain unchanged.
                <br /><br />
                <span style={{ color: "#FA8F3D", fontWeight: "600" }}>
                  NEW ERA will NEVER ask for your login codes or credentials.
                </span>
              </Text>
            </Section>

            {/* Footer */}
            <Section style={{ textAlign: "center" }}>
              <Text style={{
                fontSize: "15px",
                color: "rgba(255,255,255,0.9)",
                margin: "0 0 10px"
              }}>
                Thank you for trusting <strong style={{ color: "#FA8F3D" }}>NEW ERA</strong> ✨
              </Text>
              <Text style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.7)",
                margin: "4px 0 0"
              }}>
                Secured & Encrypted — <Link 
                  href="https://new-era-club.vercel.app/" 
                  target="_blank" 
                  style={{ color: "#FFD580", textDecoration: "none" }}
                >
                  Visit NEW ERA
                </Link>
              </Text>
            </Section>

            {/* Legal Footer */}
            <Section style={{
              marginTop: "30px",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              paddingTop: "18px"
            }}>
              <Text style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.6)",
                textAlign: "center",
                lineHeight: "1.6",
                margin: "0"
              }}>
                © 2025 NEW ERA. All rights reserved.<br />
                This is an automated security message. Please do not reply.
              </Text>
            </Section>

          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default Email;