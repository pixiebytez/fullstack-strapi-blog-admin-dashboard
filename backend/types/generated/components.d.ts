import type { Schema, Struct } from '@strapi/strapi';

export interface SharedOpenGraph extends Struct.ComponentSchema {
  collectionName: 'components_shared_open_graph';
  info: {
    description: 'Open graph metadata fields';
    displayName: 'Open Graph';
  };
  attributes: {
    ogDescription: Schema.Attribute.Text;
    ogImage: Schema.Attribute.Media<'images'>;
    ogTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    ogType: Schema.Attribute.String & Schema.Attribute.DefaultTo<'article'>;
  };
}

export interface SharedSeoMeta extends Struct.ComponentSchema {
  collectionName: 'components_shared_seo_meta';
  info: {
    description: 'SEO fields for pages and posts';
    displayName: 'SEO Meta';
  };
  attributes: {
    canonicalURL: Schema.Attribute.String;
    keywords: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    noIndex: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.open-graph': SharedOpenGraph;
      'shared.seo-meta': SharedSeoMeta;
    }
  }
}
