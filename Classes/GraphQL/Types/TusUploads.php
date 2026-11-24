<?php

declare(strict_types=1);

namespace Flowpack\Media\Ui\GraphQL\Types;

use Neos\Flow\Annotations as Flow;
use Wwwision\Types\Attributes\Description;
use Wwwision\Types\Attributes\ListBased;

#[Flow\Proxy(false)]
#[Description('A list of files which were uploaded via the TUS endpoint')]
#[ListBased(itemClassName: TusUpload::class)]
final class TusUploads implements \IteratorAggregate
{
    /**
     * @param TusUpload[] $items
     */
    private function __construct(public readonly array $items)
    {
    }

    /**
     * @return \Traversable<TusUpload>
     */
    public function getIterator(): \Traversable
    {
        yield from $this->items;
    }
}
