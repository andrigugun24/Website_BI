<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Kata Sandi</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f6f3;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f6f3;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                    {{-- Header --}}
                    <tr>
                        <td style="background: linear-gradient(135deg, #456254, #2a3c33);padding:32px 40px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                                Tataruma BI
                            </h1>
                            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;text-transform:uppercase;letter-spacing:2px;">
                                Business Intelligence Suite
                            </p>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding:40px;">
                            <h2 style="margin:0 0 8px;color:#2a3c33;font-size:20px;font-weight:700;">
                                Reset Kata Sandi
                            </h2>
                            <p style="margin:0 0 24px;color:#6d5b4b;font-size:14px;line-height:1.6;">
                                Halo <strong>{{ $userName }}</strong>,
                            </p>
                            <p style="margin:0 0 24px;color:#6d5b4b;font-size:14px;line-height:1.6;">
                                Kami menerima permintaan untuk mereset kata sandi akun Tataruma BI Anda.
                                Klik tombol di bawah ini untuk membuat kata sandi baru:
                            </p>

                            {{-- CTA Button --}}
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 32px;">
                                        <a href="{{ $resetLink }}"
                                           style="display:inline-block;background-color:#456254;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:0.3px;">
                                            Reset Kata Sandi Saya
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 16px;color:#6d5b4b;font-size:13px;line-height:1.6;">
                                Jika Anda tidak merasa meminta reset kata sandi, abaikan email ini.
                                Link ini akan kedaluwarsa dalam <strong>60 menit</strong>.
                            </p>

                            {{-- Link fallback --}}
                            <div style="background-color:#f8f6f3;border-radius:8px;padding:16px;margin-top:16px;">
                                <p style="margin:0 0 8px;color:#6d5b4b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                                    Atau salin link berikut:
                                </p>
                                <p style="margin:0;color:#456254;font-size:12px;word-break:break-all;line-height:1.5;">
                                    {{ $resetLink }}
                                </p>
                            </div>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="background-color:#f8f6f3;padding:24px 40px;text-align:center;border-top:1px solid #e6dbc9;">
                            <p style="margin:0;color:#b8a28f;font-size:11px;">
                                &copy; {{ date('Y') }} Tataruma BI — Business Intelligence Suite
                            </p>
                            <p style="margin:4px 0 0;color:#b8a28f;font-size:11px;">
                                Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
