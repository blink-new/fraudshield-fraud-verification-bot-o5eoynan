export type SupportedLanguage = 'en' | 'af' | 'zu' | 'xh'

export interface Translation {
  [key: string]: string | Translation
}

export interface Translations {
  [key: string]: Translation
}

class LanguageService {
  private currentLanguage: SupportedLanguage = 'en'
  private translations: Translations = {
    en: {
      // Main Menu
      mainMenu: {
        title: 'FraudShield - Fraud Verification Bot',
        subtitle: 'Choose an option to get started:',
        option1: 'Verify EFT / PoP',
        option2: 'Check RFQ / PO authenticity',
        option3: 'Generate release PIN for driver',
        option4: 'View today\'s fraud check log',
        help: 'Help'
      },
      
      // Payment Verification
      payment: {
        title: 'Verify EFT / Proof of Payment',
        uploadPrompt: 'Please upload the proof of payment (screenshot, PDF) or enter transaction details:',
        bankName: 'Bank Name',
        reference: 'Reference',
        amount: 'Amount',
        checking: 'Checking payment against your linked bank account...',
        verified: 'Payment verified: R{amount} cleared from {company}.',
        notCleared: 'Warning: No cleared payment found for this transaction. Please wait until funds reflect before delivering.',
        generatePin: 'Do you want me to generate a release PIN for your driver?',
        saveLog: 'Do you want to save this check to your log?',
        error: 'Unable to verify payment at this time. Please try again later.'
      },
      
      // Document Verification
      document: {
        title: 'Check RFQ / PO Authenticity',
        uploadPrompt: 'Please upload the RFQ / PO document or paste the full text/email here.',
        checking: 'Verifying document details:',
        checkingDomain: 'Checking domain legitimacy',
        checkingCompany: 'Matching company name against registry',
        checkingContact: 'Checking contact details',
        verified: 'RFQ/PO appears authentic and issued by a registered company ({company}, Reg #{regNumber}).',
        suspicious: 'Warning: Domain "{domain}" does NOT match official domain. PO may be fraudulent. Please confirm with official contact.',
        riskFactors: 'Risk factors identified:',
        confidence: 'Confidence level: {confidence}%'
      },
      
      // PIN Generation
      pin: {
        title: 'Generate Release PIN for Driver',
        prompt: 'Please enter:',
        customerName: 'Customer Name',
        orderAmount: 'Order Amount',
        checking: 'Checking previous verification...',
        verified: 'Payment verified.',
        generated: 'Release PIN for driver: {pin}',
        instruction: 'Share this PIN only when handing over goods.',
        expires: 'PIN expires in 24 hours.',
        notVerified: 'No verified payment found for this customer. Please verify payment first.'
      },
      
      // Logs
      logs: {
        title: 'Fraud Check Log',
        today: 'Here is your fraud check log for today (PDF attached).',
        specificDate: 'To view logs for a specific date, type: log YYYY-MM-DD',
        noLogs: 'No fraud checks found for today.',
        summary: 'Today\'s Summary:',
        totalChecks: 'Total checks: {count}',
        verifiedPayments: 'Verified payments: {count}',
        suspiciousDocuments: 'Suspicious documents: {count}',
        generatedPins: 'Generated PINs: {count}'
      },
      
      // Help
      help: {
        title: 'Help & Support',
        options: 'You can:',
        verifyPop: 'Verify PoP',
        checkRfq: 'Check RFQ/PO',
        getPin: 'Get driver PIN',
        viewLogs: 'View logs',
        talkToSupport: 'Or reply "Talk to support" to chat with our team.'
      },
      
      // Common
      common: {
        yes: 'Yes',
        no: 'No',
        back: 'Back',
        cancel: 'Cancel',
        continue: 'Continue',
        upload: 'Upload',
        submit: 'Submit',
        loading: 'Loading...',
        error: 'An error occurred. Please try again.',
        success: 'Success!',
        warning: 'Warning',
        info: 'Information'
      },
      
      // Status Messages
      status: {
        cleared: 'Cleared',
        pending: 'Pending',
        failed: 'Failed',
        notFound: 'Not Found',
        verified: 'Verified',
        suspicious: 'Suspicious',
        processing: 'Processing...'
      },

      // Navigation
      navigation: {
        chat: 'Chat',
        dashboard: 'Dashboard',
        settings: 'Settings'
      },

      // Dashboard
      dashboard: {
        title: 'Analytics Dashboard',
        realTimeMonitoring: 'Real-time monitoring active'
      },

      // Settings
      settings: {
        title: 'Settings',
        company: 'Company',
        notifications: 'Notifications',
        security: 'Security',
        integrations: 'Integrations',
        companyProfile: 'Company Profile',
        companyName: 'Company Name',
        registrationNumber: 'Registration Number',
        contactEmail: 'Contact Email',
        contactPhone: 'Contact Phone',
        notificationPreferences: 'Notification Preferences',
        notificationDescription: 'Configure how you receive fraud alerts and updates.',
        emailAlerts: 'Email Alerts',
        whatsappAlerts: 'WhatsApp Alerts',
        dailySummary: 'Daily Summary',
        securitySettings: 'Security Settings',
        twoFactorAuth: 'Two-Factor Authentication',
        dataEncryption: 'Data Encryption',
        auditLogs: 'Audit Logs',
        apiIntegrations: 'API Integrations',
        paymentVerification: 'Payment verification services',
        companyVerification: 'Company registry verification',
        messagingIntegration: 'Messaging and notifications'
      },

      // Notifications
      notifications: {
        suspiciousActivity: {
          subject: 'Suspicious Activity Detected'
        },
        dailySummary: {
          subject: 'Daily Fraud Detection Summary'
        }
      }
    },
    
    af: {
      // Main Menu
      mainMenu: {
        title: 'FraudShield - Bedrog Verifikasie Bot',
        subtitle: 'Kies \'n opsie om te begin:',
        option1: 'Verifieer EFT / Bewys van Betaling',
        option2: 'Kontroleer RFQ / PO egtheid',
        option3: 'Genereer vrystelling PIN vir bestuurder',
        option4: 'Bekyk vandag se bedrog kontrole log',
        help: 'Hulp'
      },
      
      // Payment Verification
      payment: {
        title: 'Verifieer EFT / Bewys van Betaling',
        uploadPrompt: 'Laai asseblief die bewys van betaling op (skermkiekie, PDF) of voer transaksie besonderhede in:',
        bankName: 'Bank Naam',
        reference: 'Verwysing',
        amount: 'Bedrag',
        checking: 'Kontroleer betaling teen jou gekoppelde bankrekening...',
        verified: 'Betaling geverifieer: R{amount} geklaar van {company}.',
        notCleared: 'Waarskuwing: Geen geklaarde betaling gevind vir hierdie transaksie nie. Wag asseblief totdat fondse reflekteer voor aflewering.',
        generatePin: 'Wil jy hê ek moet \'n vrystelling PIN vir jou bestuurder genereer?',
        saveLog: 'Wil jy hierdie kontrole in jou log stoor?',
        error: 'Kan nie betaling op hierdie tydstip verifieer nie. Probeer asseblief later weer.'
      },
      
      // Document Verification
      document: {
        title: 'Kontroleer RFQ / PO Egtheid',
        uploadPrompt: 'Laai asseblief die RFQ / PO dokument op of plak die volle teks/e-pos hier.',
        checking: 'Verifieer dokument besonderhede:',
        checkingDomain: 'Kontroleer domein legitimiteit',
        checkingCompany: 'Pas maatskappy naam teen register',
        checkingContact: 'Kontroleer kontak besonderhede',
        verified: 'RFQ/PO lyk eg en uitgereik deur \'n geregistreerde maatskappy ({company}, Reg #{regNumber}).',
        suspicious: 'Waarskuwing: Domein "{domain}" stem NIE ooreen met amptelike domein nie. PO kan bedrieglik wees. Bevestig asseblief met amptelike kontak.',
        riskFactors: 'Risiko faktore geïdentifiseer:',
        confidence: 'Vertroue vlak: {confidence}%'
      },
      
      // PIN Generation
      pin: {
        title: 'Genereer Vrystelling PIN vir Bestuurder',
        prompt: 'Voer asseblief in:',
        customerName: 'Kliënt Naam',
        orderAmount: 'Bestelling Bedrag',
        checking: 'Kontroleer vorige verifikasie...',
        verified: 'Betaling geverifieer.',
        generated: 'Vrystelling PIN vir bestuurder: {pin}',
        instruction: 'Deel hierdie PIN slegs wanneer goedere oorhandig word.',
        expires: 'PIN verval oor 24 uur.',
        notVerified: 'Geen geverifieerde betaling gevind vir hierdie kliënt nie. Verifieer asseblief eers betaling.'
      },
      
      // Logs
      logs: {
        title: 'Bedrog Kontrole Log',
        today: 'Hier is jou bedrog kontrole log vir vandag (PDF aangeheg).',
        specificDate: 'Om logs vir \'n spesifieke datum te sien, tik: log JJJJ-MM-DD',
        noLogs: 'Geen bedrog kontroles gevind vir vandag nie.',
        summary: 'Vandag se Opsomming:',
        totalChecks: 'Totale kontroles: {count}',
        verifiedPayments: 'Geverifieerde betalings: {count}',
        suspiciousDocuments: 'Verdagte dokumente: {count}',
        generatedPins: 'Gegenereerde PINs: {count}'
      },
      
      // Help
      help: {
        title: 'Hulp & Ondersteuning',
        options: 'Jy kan:',
        verifyPop: 'Verifieer PoP',
        checkRfq: 'Kontroleer RFQ/PO',
        getPin: 'Kry bestuurder PIN',
        viewLogs: 'Bekyk logs',
        talkToSupport: 'Of antwoord "Praat met ondersteuning" om met ons span te gesels.'
      },
      
      // Common
      common: {
        yes: 'Ja',
        no: 'Nee',
        back: 'Terug',
        cancel: 'Kanselleer',
        continue: 'Gaan voort',
        upload: 'Laai op',
        submit: 'Dien in',
        loading: 'Laai...',
        error: '\'n Fout het voorgekom. Probeer asseblief weer.',
        success: 'Sukses!',
        warning: 'Waarskuwing',
        info: 'Inligting'
      },
      
      // Status Messages
      status: {
        cleared: 'Geklaar',
        pending: 'Hangende',
        failed: 'Misluk',
        notFound: 'Nie Gevind',
        verified: 'Geverifieer',
        suspicious: 'Verdagte',
        processing: 'Verwerk...'
      },

      // Navigation
      navigation: {
        chat: 'Gesels',
        dashboard: 'Dashboard',
        settings: 'Instellings'
      },

      // Dashboard
      dashboard: {
        title: 'Analise Dashboard',
        realTimeMonitoring: 'Intydse monitering aktief'
      },

      // Settings
      settings: {
        title: 'Instellings',
        company: 'Maatskappy',
        notifications: 'Kennisgewings',
        security: 'Sekuriteit',
        integrations: 'Integrasies',
        companyProfile: 'Maatskappy Profiel',
        companyName: 'Maatskappy Naam',
        registrationNumber: 'Registrasie Nommer',
        contactEmail: 'Kontak E-pos',
        contactPhone: 'Kontak Telefoon',
        notificationPreferences: 'Kennisgewing Voorkeure',
        notificationDescription: 'Stel op hoe jy bedrog waarskuwings en opdaterings ontvang.',
        emailAlerts: 'E-pos Waarskuwings',
        whatsappAlerts: 'WhatsApp Waarskuwings',
        dailySummary: 'Daaglikse Opsomming',
        securitySettings: 'Sekuriteit Instellings',
        twoFactorAuth: 'Twee-Faktor Verifikasie',
        dataEncryption: 'Data Enkripsie',
        auditLogs: 'Oudit Logs',
        apiIntegrations: 'API Integrasies',
        paymentVerification: 'Betaling verifikasie dienste',
        companyVerification: 'Maatskappy register verifikasie',
        messagingIntegration: 'Boodskappe en kennisgewings'
      },

      // Notifications
      notifications: {
        suspiciousActivity: {
          subject: 'Verdagte Aktiwiteit Opgespoor'
        },
        dailySummary: {
          subject: 'Daaglikse Bedrog Opsporing Opsomming'
        }
      }
    },
    
    zu: {
      // Main Menu
      mainMenu: {
        title: 'FraudShield - I-Bot Yokuqinisekisa Ukukhohlisa',
        subtitle: 'Khetha inketho ukuze uqale:',
        option1: 'Qinisekisa i-EFT / Ubufakazi Bokukhokha',
        option2: 'Hlola ukuqiniseka kwe-RFQ / PO',
        option3: 'Khiqiza i-PIN yokukhulula umshayeli',
        option4: 'Buka ilog yokuhlola ukukhohlisa yanamuhla',
        help: 'Usizo'
      },
      
      // Payment Verification
      payment: {
        title: 'Qinisekisa i-EFT / Ubufakazi Bokukhokha',
        uploadPrompt: 'Sicela ulayishe ubufakazi bokukhokha (isithombe-skrini, i-PDF) noma ufake imininingwane yentengiselwano:',
        bankName: 'Igama Lebhange',
        reference: 'Inkomba',
        amount: 'Imali',
        checking: 'Sihlola inkokhelo ngokumelene ne-akhawunti yakho yebhange ehlanganisiwe...',
        verified: 'Inkokhelo iqinisekisiwe: R{amount} isuswe ku-{company}.',
        notCleared: 'Isexwayiso: Ayikho inkokhelo eqedisiwe etholakele kule ntengiselwano. Sicela ulinde kuze kufike imali ngaphambi kokulethwa.',
        generatePin: 'Ingabe ufuna ngikhiqize i-PIN yokukhulula umshayeli wakho?',
        saveLog: 'Ingabe ufuna ukugcina lolu hlolo ku-log yakho?',
        error: 'Ayikwazi ukuqinisekisa inkokhelo ngalesi sikhathi. Sicela uzame futhi kamuva.'
      },
      
      // Document Verification
      document: {
        title: 'Hlola Ukuqiniseka kwe-RFQ / PO',
        uploadPrompt: 'Sicela ulayishe idokhumenti ye-RFQ / PO noma unamathisele umbhalo ogcwele/i-imeyili lapha.',
        checking: 'Siqinisekisa imininingwane yedokhumenti:',
        checkingDomain: 'Sihlola ukusemthethweni kwe-domain',
        checkingCompany: 'Sifanisa igama lenkampani ngohlelo',
        checkingContact: 'Sihlola imininingwane yokuxhumana',
        verified: 'I-RFQ/PO ibonakala iqinisile futhi ikhishwe yinkampani ebhalisiwe ({company}, Reg #{regNumber}).',
        suspicious: 'Isexwayiso: I-domain "{domain}" AYIFANI ne-domain esemthethweni. I-PO ingaba ukukhohlisa. Sicela uqinisekise ngoxhumana osemthethweni.',
        riskFactors: 'Izici zobungozi zihlonziwe:',
        confidence: 'Izinga lokuzethemba: {confidence}%'
      },
      
      // PIN Generation
      pin: {
        title: 'Khiqiza i-PIN Yokukhulula Umshayeli',
        prompt: 'Sicela ufake:',
        customerName: 'Igama Lekhasimende',
        orderAmount: 'Imali Ye-oda',
        checking: 'Sihlola ukuqinisekiswa kwangaphambilini...',
        verified: 'Inkokhelo iqinisekisiwe.',
        generated: 'I-PIN yokukhulula umshayeli: {pin}',
        instruction: 'Yabelana nge-PIN kuphela lapho unikeza izimpahla.',
        expires: 'I-PIN iphelelwa isikhathi emahora angu-24.',
        notVerified: 'Ayikho inkokhelo eqinisekisiwe etholakele kule khasimende. Sicela uqinisekise inkokhelo kuqala.'
      },
      
      // Logs
      logs: {
        title: 'I-Log Yokuhlola Ukukhohlisa',
        today: 'Nali i-log yakho yokuhlola ukukhohlisa yanamuhla (i-PDF inamathisiwe).',
        specificDate: 'Ukubona ama-log osuku oluthile, thayipha: log YYYY-MM-DD',
        noLogs: 'Awekho amahlolo okuhohlisa atholakele namuhla.',
        summary: 'Isifinyezo Sanamuhla:',
        totalChecks: 'Amahlolo aphelele: {count}',
        verifiedPayments: 'Izinkokhelo eziqinisekisiwe: {count}',
        suspiciousDocuments: 'Amadokhumenti asolisayo: {count}',
        generatedPins: 'Ama-PIN akhiqiziwe: {count}'
      },
      
      // Help
      help: {
        title: 'Usizo Nokusekelwa',
        options: 'Ungakwazi:',
        verifyPop: 'Qinisekisa i-PoP',
        checkRfq: 'Hlola i-RFQ/PO',
        getPin: 'Thola i-PIN yomshayeli',
        viewLogs: 'Buka ama-log',
        talkToSupport: 'Noma uphendule "Khuluma nokusekelwa" ukuze uxoxe neqembu lethu.'
      },
      
      // Common
      common: {
        yes: 'Yebo',
        no: 'Cha',
        back: 'Emuva',
        cancel: 'Khansela',
        continue: 'Qhubeka',
        upload: 'Layisha',
        submit: 'Thumela',
        loading: 'Iyalayisha...',
        error: 'Kukhona iphutha. Sicela uzame futhi.',
        success: 'Impumelelo!',
        warning: 'Isexwayiso',
        info: 'Ulwazi'
      },
      
      // Status Messages
      status: {
        cleared: 'Kuqediwe',
        pending: 'Kulindile',
        failed: 'Kuhlulekile',
        notFound: 'Akutholakalanga',
        verified: 'Kuqinisekisiwe',
        suspicious: 'Kusolisayo',
        processing: 'Kuyacutshungulwa...'
      }
    },
    
    xh: {
      // Main Menu
      mainMenu: {
        title: 'FraudShield - I-Bot Yokuqinisekisa Ubuqhetseba',
        subtitle: 'Khetha inketho ukuze uqale:',
        option1: 'Qinisekisa i-EFT / Ubungqina Bentlawulo',
        option2: 'Jonga ukuba yinyani i-RFQ / PO',
        option3: 'Yenza i-PIN yokukhulula umqhubi',
        option4: 'Jonga ilog yokuhlola ubuqhetseba yanamhla',
        help: 'Uncedo'
      },
      
      // Payment Verification
      payment: {
        title: 'Qinisekisa i-EFT / Ubungqina Bentlawulo',
        uploadPrompt: 'Nceda ufake ubungqina bentlawulo (umfanekiso-skrini, i-PDF) okanye ufake iinkcukacha zentengiselwano:',
        bankName: 'Igama Lebhanki',
        reference: 'Isalathiso',
        amount: 'Imali',
        checking: 'Sihlola intlawulo ngokuchasene ne-akhawunti yakho yebhanki edibanisiweyo...',
        verified: 'Intlawulo iqinisekisiwe: R{amount} isuswe ku-{company}.',
        notCleared: 'Isilumkiso: Akukho ntlawulo igqityiweyo ifunyenweyo kule ntengiselwano. Nceda ulinde de imali ibonakale ngaphambi kokuhanjiswa.',
        generatePin: 'Ingaba ufuna ndiyenze i-PIN yokukhulula umqhubi wakho?',
        saveLog: 'Ingaba ufuna ukugcina olu hlolo kwi-log yakho?',
        error: 'Ayikwazi ukuqinisekisa intlawulo ngeli xesha. Nceda uzame kwakhona kamva.'
      },
      
      // Document Verification
      document: {
        title: 'Hlola Ukuba Yinyani i-RFQ / PO',
        uploadPrompt: 'Nceda ufake uxwebhu lwe-RFQ / PO okanye uncamathisele umbhalo opheleleyo/i-imeyili apha.',
        checking: 'Siqinisekisa iinkcukacha zoxwebhu:',
        checkingDomain: 'Sihlola ukusemthethweni kwe-domain',
        checkingCompany: 'Sithelekisa igama lenkampani noluhlu',
        checkingContact: 'Sihlola iinkcukacha zonxibelelwano',
        verified: 'I-RFQ/PO ibonakala iyinyani kwaye ikhutshwe yinkampani ebhalisiweyo ({company}, Reg #{regNumber}).',
        suspicious: 'Isilumkiso: I-domain "{domain}" AYIHAMBELANI ne-domain esemthethweni. I-PO inokuba bubuqhetseba. Nceda uqinisekise ngonxibelelwano olusemthethweni.',
        riskFactors: 'Izinto ezinobungozi zichongiwe:',
        confidence: 'Inqanaba lokuzithemba: {confidence}%'
      },
      
      // PIN Generation
      pin: {
        title: 'Yenza i-PIN Yokukhulula Umqhubi',
        prompt: 'Nceda ufake:',
        customerName: 'Igama Lomthengi',
        orderAmount: 'Imali Ye-oda',
        checking: 'Sihlola ukuqinisekiswa kwangaphambili...',
        verified: 'Intlawulo iqinisekisiwe.',
        generated: 'I-PIN yokukhulula umqhubi: {pin}',
        instruction: 'Yabelana nge-PIN kuphela xa unikezela ngempahla.',
        expires: 'I-PIN iphelelwa lixesha kwiiyure ezingama-24.',
        notVerified: 'Akukho ntlawulo iqinisekisiweyo ifunyenweyo kulo mthengi. Nceda uqinisekise intlawulo kuqala.'
      },
      
      // Logs
      logs: {
        title: 'I-Log Yokuhlola Ubuqhetseba',
        today: 'Nali i-log yakho yokuhlola ubuqhetseba yanamhla (i-PDF incanyathiselwe).',
        specificDate: 'Ukubona ii-log zosuku oluthile, chwetheza: log YYYY-MM-DD',
        noLogs: 'Akukho kuhlolwa kwebuqhetseba kufunyenweyo namhla.',
        summary: 'Isishwankathelo Sanamhla:',
        totalChecks: 'Ukuhlolwa okupheleleyo: {count}',
        verifiedPayments: 'Iintlawulo eziqinisekisiweyo: {count}',
        suspiciousDocuments: 'Amaxwebhu akrokrelayo: {count}',
        generatedPins: 'Ii-PIN ezenziweyo: {count}'
      },
      
      // Help
      help: {
        title: 'Uncedo Nenkxaso',
        options: 'Unokwenza:',
        verifyPop: 'Qinisekisa i-PoP',
        checkRfq: 'Hlola i-RFQ/PO',
        getPin: 'Fumana i-PIN yomqhubi',
        viewLogs: 'Jonga ii-log',
        talkToSupport: 'Okanye uphendule "Thetha nenkxaso" ukuze uncokole neqela lethu.'
      },
      
      // Common
      common: {
        yes: 'Ewe',
        no: 'Hayi',
        back: 'Emva',
        cancel: 'Rhoxisa',
        continue: 'Qhubeka',
        upload: 'Faka',
        submit: 'Ngenisa',
        loading: 'Iyalayisha...',
        error: 'Kukhona impazamo. Nceda uzame kwakhona.',
        success: 'Impumelelo!',
        warning: 'Isilumkiso',
        info: 'Ulwazi'
      },
      
      // Status Messages
      status: {
        cleared: 'Kugqityiwe',
        pending: 'Kulindile',
        failed: 'Kusilele',
        notFound: 'Akufumanekanga',
        verified: 'Kuqinisekisiwe',
        suspicious: 'Kukrokrelayo',
        processing: 'Kuyacutshungulwa...'
      }
    }
  }

  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.')
    let translation: any = this.translations[this.currentLanguage]

    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k]
      } else {
        // Fallback to English if translation not found
        translation = this.translations.en
        for (const fallbackKey of keys) {
          if (translation && typeof translation === 'object' && fallbackKey in translation) {
            translation = translation[fallbackKey]
          } else {
            return key // Return key if no translation found
          }
        }
        break
      }
    }

    if (typeof translation !== 'string') {
      return key
    }

    // Replace parameters in translation
    if (params) {
      return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match
      })
    }

    return translation
  }

  // Get available languages with their native names
  getAvailableLanguages(): Array<{ code: SupportedLanguage; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
      { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
      { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' }
    ]
  }

  // Detect language from user input (basic implementation)
  detectLanguage(text: string): SupportedLanguage {
    const lowerText = text.toLowerCase()

    // Afrikaans detection
    const afrikaansWords = ['ja', 'nee', 'asseblief', 'dankie', 'goeie', 'dag', 'hoe', 'gaan', 'dit']
    if (afrikaansWords.some(word => lowerText.includes(word))) {
      return 'af'
    }

    // Zulu detection
    const zuluWords = ['sawubona', 'yebo', 'cha', 'ngiyabonga', 'kunjani', 'ngiyakujabulela']
    if (zuluWords.some(word => lowerText.includes(word))) {
      return 'zu'
    }

    // Xhosa detection
    const xhosaWords = ['molo', 'ewe', 'hayi', 'enkosi', 'kunjani', 'ndiyavuya']
    if (xhosaWords.some(word => lowerText.includes(word))) {
      return 'xh'
    }

    // Default to English
    return 'en'
  }

  // Format currency based on language
  formatCurrency(amount: number): string {
    const formatter = new Intl.NumberFormat(this.getLocale(), {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    })
    return formatter.format(amount)
  }

  // Format date based on language
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat(this.getLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  private getLocale(): string {
    switch (this.currentLanguage) {
      case 'af': return 'af-ZA'
      case 'zu': return 'zu-ZA'
      case 'xh': return 'xh-ZA'
      default: return 'en-ZA'
    }
  }
}

export const languageService = new LanguageService()