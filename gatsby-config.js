module.exports = {
  siteMetadata: {
    title: `seonghyeon.dev`,
    name: `seonghyeon.dev`,
    siteUrl: `https://seonghyeon.dev`,
    description: `Seonghyeon Kim's blog`,
    hero: {
      // heading: `<p style="font-size: 20px;color: #7A8085;">~/seonghyeon.dev</p><div style="display: inline-flex;">><input style="border: none; background: transparent;" placeholder="_"></input></div>`,
      heading: `<a href="https://github.com/NovemberOscar"> <img id="github-heatmap" src="https://ghchart.rshah.org/NovemberOscar" alt="GitHub contribution heatmap"> </a>`,
      maxWidth: 600,
    },
    social: [
      {
        name: `twitter`,
        url: `https://twitter.com/NovemberOscar_`,
      },
      {
        name: `github`,
        url: `https://github.com/NovemberOscar`,
      },
      {
        name: `linkedin`,
        url: `https://www.linkedin.com/in/novemberoscar/`,
      },
    ],
  },
  plugins: [
    {
      resolve: "@narative/gatsby-theme-novela",
      options: {
        contentPosts: "content/posts",
        contentAuthors: "content/authors",
        basePath: "/",
        authorsPage: false,
        sources: {
          local: true,
          // contentful: true,
        },
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Novela by Narative`,
        short_name: `Novela`,
        start_url: `/`,
        background_color: `#fff`,
        theme_color: `#fff`,
        display: `standalone`,
        icon: `src/assets/favicon.png`,
      },
    },
  ],
};
