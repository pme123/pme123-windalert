<template>
  <footer class="z9-footer">
    <div class="z9-footer-inner">
      <div class="z9-copyright">© 2026 z9nai GmbH // Alle Rechte vorbehalten</div>
      <div class="z9-footer-right">
        <button class="footer-btn" @click="showPrivacy = true">Datenschutz</button>
        <a href="mailto:hallo@z9nai.ch" class="z9-mail-icon" title="hallo@z9nai.ch">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        </svg>
        </a>
      </div>
    </div>

    <!-- Datenschutz Modal -->
    <div v-if="showPrivacy" class="privacy-overlay" @click.self="showPrivacy = false">
      <div class="privacy-modal">
        <div class="privacy-header">
          <span>Datenschutzerklärung</span>
          <button class="privacy-close" @click="showPrivacy = false">✕</button>
        </div>
        <div class="privacy-body">
          <p class="privacy-intro">z9nai GmbH · Schweiz · <a href="mailto:hallo@z9nai.ch">hallo@z9nai.ch</a></p>
          <hr>
          <h4>Keine Cookies, kein Tracking</h4>
          <p>Diese Website verwendet keine Cookies und keine Tracking- oder Analyse-Tools. Es werden keine persönlichen Daten durch Drittdienste erhoben oder weitergegeben.</p>
          <h4>Hosting – GitHub Pages</h4>
          <p>Diese Website wird über GitHub Pages gehostet (GitHub Inc., San Francisco, USA). Beim Aufruf erhebt GitHub automatisch technische Zugriffsdaten (IP-Adresse, Zeitstempel). Weitere Informationen: <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener">GitHub Privacy Policy</a>.</p>
          <h4>Wetterdaten</h4>
          <p>Wetterdaten werden je nach Station von <a href="https://pioupiou.fr" target="_blank" rel="noopener">Pioupiou / OpenWindMap</a>, <a href="https://www.meteoswiss.admin.ch" target="_blank" rel="noopener">MeteoSwiss</a> oder <a href="https://www.wunderground.com" target="_blank" rel="noopener">Weather Underground</a> bezogen. Beim Datenabruf wird deine IP-Adresse an den jeweiligen Anbieter übermittelt.</p>
          <h4>Kontakt per E-Mail</h4>
          <p>Anfragen per E-Mail werden ausschliesslich zur Bearbeitung deiner Anfrage verwendet und nicht an Dritte weitergegeben.</p>
          <h4>Deine Rechte (nDSG)</h4>
          <p>Nach dem Schweizer Datenschutzgesetz hast du das Recht auf Auskunft, Berichtigung und Löschung. Kontakt: <a href="mailto:hallo@z9nai.ch">hallo@z9nai.ch</a>.</p>
          <hr>
          <p class="privacy-footer-text">z9nai GmbH · Sonnenweg 23a · Schweiz · UID: CHE-453.251.270<br>Stand: Mai 2026</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const showPrivacy = ref(false)
</script>
