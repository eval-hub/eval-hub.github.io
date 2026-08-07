# Makefile for eval-hub.github.io documentation

.PHONY: help install serve build deploy clean diagrams

# Default target
help:
	@echo "Available targets:"
	@echo "  install    - Install documentation dependencies"
	@echo "  serve      - Start local development server"
	@echo "  build      - Build documentation site"
	@echo "  clean      - Remove built documentation"
	@echo "  diagrams   - Generate all diagrams from D2 sources"

# Install dependencies
install:
	@echo "Installing documentation dependencies..."
	npm install

# Serve documentation locally
serve:
	@echo "Starting documentation server..."
	npm run dev -- --host 0.0.0.0

# Build documentation
build:
	@echo "Building documentation..."
	npm run build

# Clean built documentation
clean:
	@echo "Cleaning built documentation..."
	rm -rf dist/ .astro/

# Generate all diagrams from D2 sources (requires d2: https://d2lang.com/)
# Uses dual-theme SVGs: light (Neutral Grey) + dark (Dark Mauve)
# Post-processing:
#   - Background rect made transparent to blend with Starlight's theme
#   - Dark mode Catppuccin purple accent replaced with neutral greys matching Starlight
diagrams:
	@echo "Generating diagrams from D2 sources..."
	@mkdir -p public/images/diagrams
	@for f in diagrams/*.d2; do \
		name=$$(basename "$$f" .d2); \
		echo "  $$name.svg"; \
		d2 -l elk --elk-nodeNodeBetweenLayers 10 --elk-padding "[top=8,left=8,bottom=8,right=8]" --pad 5 --theme 1 --dark-theme 200 "$$f" "public/images/diagrams/$$name.svg"; \
		sed -i \
			-e 's/class=" fill-N7"/class=" fill-N7" fill-opacity="0"/g' \
			-e 's/\.fill-B1{fill:#CBA6f7;}/.fill-B1{fill:#c0c3c9;}/g' \
			-e 's/\.fill-B2{fill:#CBA6f7;}/.fill-B2{fill:#878b95;}/g' \
			-e 's/\.fill-B3{fill:#6C7086;}/.fill-B3{fill:#555964;}/g' \
			-e 's/\.fill-B4{fill:#585B70;}/.fill-B4{fill:#2a2d35;}/g' \
			-e 's/\.fill-B5{fill:#45475A;}/.fill-B5{fill:#35383f;}/g' \
			-e 's/\.fill-B6{fill:#313244;}/.fill-B6{fill:#2a2d35;}/g' \
			-e 's/color-border-default:#CBA6f7/color-border-default:#878b95/g' \
			-e 's/color-border-muted:#CBA6f7/color-border-muted:#555964/g' \
			-e 's/color-accent-fg:#CBA6f7/color-accent-fg:#878b95/g' \
			-e 's/color-accent-emphasis:#CBA6f7/color-accent-emphasis:#878b95/g' \
			-e 's/#CBA6f7/#878b95/g' \
			"public/images/diagrams/$$name.svg"; \
	done
	@echo "All diagrams generated in public/images/diagrams/"

# Build and serve
preview: build
	npm run preview
