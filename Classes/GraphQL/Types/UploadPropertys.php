<?php

declare(strict_types=1);

namespace Flowpack\Media\Ui\GraphQL\Types;

use Neos\Flow\Annotations as Flow;
use Wwwision\Types\Attributes\Description;
use Wwwision\Types\Attributes\ListBased;

#[Flow\Proxy(false)]
#[Description('A list of additional upload properties per file')]
#[ListBased(itemClassName: UploadProperty::class)]
final class UploadPropertys implements \IteratorAggregate
{
    /**
     * @param UploadProperty[] $items
     */
    private function __construct(public readonly array $items)
    {
    }

    /**
     * @param UploadProperty[] $items
     */
    public static function fromArray(array $items): self
    {
        return new self($items);
    }

    public static function empty(): self
    {
        return new self([]);
    }

    public function findByFilename(string $filename): ?UploadProperty
    {
        foreach ($this->items as $item) {
            if ($item->filename === $filename) {
                return $item;
            }
        }
        return null;
    }

    /**
     * @return \Traversable<UploadProperty>
     */
    public function getIterator(): \Traversable
    {
        yield from $this->items;
    }
}
