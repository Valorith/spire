<template>
  <div class="achievement-guide" data-testid="achievement-authoring-guide">
    <section class="achievement-guide__hero">
      <div>
        <span class="achievement-eyebrow">Safe authoring reference</span>
        <h2>How an achievement becomes durable character state</h2>
        <p>
          A definition is one transactional graph. The server validates and publishes that graph as a unit, while
          character completion, progress, reward, and selection ledgers remain separate runtime state.
        </p>
      </div>
      <div class="achievement-guide__flow" aria-label="Achievement lifecycle">
        <span>Author disabled</span><i class="fa fa-angle-right"></i>
        <span>Validate</span><i class="fa fa-angle-right"></i>
        <span>Publish</span><i class="fa fa-angle-right"></i>
        <span>Observe events</span><i class="fa fa-angle-right"></i>
        <span>Award once</span>
      </div>
    </section>

    <div class="achievement-guide__grid">
      <article>
        <h3><i class="fa fa-cubes"></i> Components and criteria</h3>
        <p>Components are client presentation groups. Types 0-2 can carry state; type 3 is presentation-only.</p>
        <ul>
          <li>Keep each component type + component ID pair stable and unique.</li>
          <li>Required criteria participate in completion. Optional criteria can still display progress.</li>
          <li>Disabled rows remain authored but are excluded from active evaluation.</li>
          <li>Use event help beside each target. The same numeric column has different meaning per event.</li>
        </ul>
      </article>
      <article>
        <h3><i class="fa fa-line-chart"></i> Progress modes</h3>
        <dl>
          <template v-for="option in options('progress_modes')">
            <dt :key="'progress-dt-' + option.value">{{ option.value }} — {{ option.label }}</dt>
            <dd :key="'progress-dd-' + option.value">{{ option.help }}</dd>
          </template>
        </dl>
      </article>
      <article>
        <h3><i class="fa fa-gift"></i> Rewards and choices</h3>
        <p>Canonical rewards are the grants. Selectable options only map those grants into client choices.</p>
        <ul>
          <li>Reward IDs are durable identities, not row order. Never casually renumber deployed grants.</li>
          <li>Each enabled option needs at least one mapped, enabled grant.</li>
          <li>Common grants are combined with exactly one selected non-common option.</li>
          <li>A disabled grant can remain mapped for safe staged authoring, but does not satisfy validation.</li>
        </ul>
      </article>
      <article>
        <h3><i class="fa fa-shield"></i> Version and reset safety</h3>
        <p>
          Increment the definition version only for an incompatible deployed graph change. Reset-on-version-change is
          destructive to older character completion, progress, reward, and selection state after the server observes
          the mismatch. Use it deliberately and document the reason.
        </p>
      </article>
      <article>
        <h3><i class="fa fa-ban"></i> Cast restrictions</h3>
        <p>
          These rows reuse server spell restriction numbers. A completed requirement passes only when the referenced
          achievement is complete; an incomplete requirement passes only while it is not complete. All applicable rows
          sharing a restriction ID must pass.
        </p>
      </article>
      <article>
        <h3><i class="fa fa-database"></i> Database and snapshot safety</h3>
        <p>
          This editor loads the schema capability document before enabling writes. Missing tables or columns make the
          workspace read-only. Saves send the complete graph with its expected version so concurrent edits produce a
          visible stale-write conflict instead of silently overwriting newer data.
        </p>
      </article>
    </div>

    <section class="achievement-guide__events">
      <h3>Criterion event reference</h3>
      <div class="achievement-guide__event-grid">
        <article v-for="event in options('events')" :key="String(event.value)">
          <h4>{{ event.value }} — {{ event.label }}</h4>
          <p>{{ event.help }}</p>
          <small><strong>{{ event.target1_label || 'Target ID' }}:</strong> {{ event.target1_help }}</small>
          <small><strong>{{ event.target2_label || 'Secondary target' }}:</strong> {{ event.target2_help }}</small>
          <small><strong>{{ event.target_value_label || 'Target value' }}:</strong> {{ event.target_value_help }}</small>
        </article>
      </div>
    </section>

    <section class="achievement-guide__npc">
      <div>
        <h3>NPC-name event helper</h3>
        <p>
          NPC Name Kill stores an unsigned 32-bit FNV-1a hash of a canonical name. Spaces and underscores collapse to
          one space, ASCII letters become lowercase, and other characters are removed.
        </p>
      </div>
      <div class="achievement-guide__npc-form">
        <label for="achievement-guide-npc-name">NPC name to canonicalize</label>
        <input id="achievement-guide-npc-name" v-model="npcName" class="form-control form-control-sm" aria-describedby="achievement-guide-npc-help">
        <small id="achievement-guide-npc-help">Canonical: <strong>{{ canonicalName || '—' }}</strong> · Hash: <strong>{{ npcHash }}</strong></small>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { canonicalizeNpcName, enumOptions, npcNameHash } from '@/app/achievements'

  export default Vue.extend({
    name: 'AchievementAuthoringGuide',
    props: {
      metadata: { type: Object, required: true }
    },
    data () {
      return { npcName: '' }
    },
    computed: {
      canonicalName (): string { return canonicalizeNpcName(this.npcName) },
      npcHash (): number { return npcNameHash(this.npcName) }
    },
    methods: {
      options (key: string): any[] { return enumOptions(this.metadata, key) }
    }
  })
</script>
