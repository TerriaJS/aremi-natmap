#
# This little filter is for the 'jq' command line tool, and turns pre-refactor
# init_*.json files into the post-refactor style JSON.
#
# It's a work in progress, and only really deals with the AREMI specific data,
# but may be useful as a base for extension.
#

{
  services: [],
  catalog: [

    # for each major catalog
    .Layer[] | {
      name: .name,
      type: "group",
      items: [

        # for each category
        .Layer[] | {
          name: .name,
          type: "group",

          items: [
            # for each layer in this category
            .Layer[] | {
              name: .Title,
              layers: .Name,
              description: .description,
              dataCustodian: .dataCustodian,
              url: .base_url,

              type: (if .type == "WMS" then
                "wms"
              else
                .type
              end),

              rectangle: .BoundingBox | [
                .west,
                .south,
                .east,
                .north
              ]
            }
          ]
        }
      ]
    }
  ]
}
